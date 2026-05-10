import React, { createContext, useState, useCallback, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://talksy-3py1.onrender.com/api/messages";
const CACHE_TTL = 30000; // 30 seconds before re-fetch allowed

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const currentChatRef = useRef(null); // track which chat is currently open
    const lastFetchTimeRef = useRef(0); // timestamp of last conversations fetch
    const hasFetchedOnceRef = useRef(false); // whether we've fetched at least once

    // ─── Per-conversation message cache ───
    // Structure: { [conversationKey]: { messages: [], page: 1, hasMore: false, lastFetchTime: 0 } }
    const messagesCacheRef = useRef({});

    // ─── Load Offline Cache on Startup ───
    React.useEffect(() => {
        const loadCache = async () => {
            try {
                const storedConvs = await AsyncStorage.getItem("talksy_conversations");
                if (storedConvs) {
                    setConversations(JSON.parse(storedConvs));
                    hasFetchedOnceRef.current = true; // prevent initial loading flickers
                }
                const storedMsgs = await AsyncStorage.getItem("talksy_messages");
                if (storedMsgs) {
                    messagesCacheRef.current = JSON.parse(storedMsgs);
                }
            } catch (err) { console.log("Failed to load cache", err); }
        };
        loadCache();
    }, []);

    const saveMessageCache = () => {
        AsyncStorage.setItem("talksy_messages", JSON.stringify(messagesCacheRef.current)).catch(() => {});
    };

    // Set which chat is currently being viewed
    const setCurrentChat = useCallback((userId) => {
        currentChatRef.current = userId;
    }, []);

    const getCurrentChat = useCallback(() => {
        return currentChatRef.current;
    }, []);

    // ─── Fetch conversations list (with smart caching) ───
    const fetchConversations = useCallback(async (force = false) => {
        const now = Date.now();
        const timeSinceLast = now - lastFetchTimeRef.current;

        // Skip fetch if we have data and it's recent (unless forced)
        if (!force && hasFetchedOnceRef.current && timeSinceLast < CACHE_TTL) {
            return;
        }

        try {
            setLoadingConversations(true);
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) return;

            const { data } = await axios.get(`${API}/conversations/${userId}`);
            if (data.success) {
                setConversations(data.conversations);
                AsyncStorage.setItem("talksy_conversations", JSON.stringify(data.conversations)).catch(() => {});
                lastFetchTimeRef.current = Date.now();
                hasFetchedOnceRef.current = true;
            }
        } catch (err) {
            console.log("Error fetching conversations:", err.message);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    // ─── Message Cache helpers ───
    const getCacheKey = (userId1, userId2) => {
        return [userId1, userId2].sort().join("_");
    };

    // ─── Centralized Message Cache Sync ───
    const syncMessageToCache = useCallback((senderId, receiverId, messageOrMessages) => {
        const key = getCacheKey(senderId, receiverId);
        const cached = messagesCacheRef.current[key] || { messages: [], page: 1, hasMore: true };
        
        const incoming = Array.isArray(messageOrMessages) ? messageOrMessages : [messageOrMessages];
        const mergedMap = new Map();
        
        // Add existing cached messages
        cached.messages.forEach(m => mergedMap.set(m._id || m.clientId, m));
        
        // Merge incoming (server data takes priority)
        incoming.forEach(m => {
            const id = m._id || m.clientId;
            mergedMap.set(id, { ...(mergedMap.get(id) || {}), ...m });
        });

        const finalMessages = Array.from(mergedMap.values())
            .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
            .slice(0, 500); // Prevent memory growth: keep last 500 messages per chat

        messagesCacheRef.current[key] = {
            ...cached,
            messages: finalMessages,
            lastFetchTime: Date.now()
        };
        saveMessageCache();
    }, []);

    const getCachedMessages = useCallback((senderId, receiverId) => {
        const key = getCacheKey(senderId, receiverId);
        return messagesCacheRef.current[key] || null;
    }, []);

    const setCachedMessages = useCallback((senderId, receiverId, data) => {
        const key = getCacheKey(senderId, receiverId);
        messagesCacheRef.current[key] = {
            ...data,
            lastFetchTime: Date.now(),
        };
        saveMessageCache();
    }, []);

    const addMessageToCache = useCallback((senderId, receiverId, message) => {
        syncMessageToCache(senderId, receiverId, message);
    }, [syncMessageToCache]);

    // Update conversation when a new message arrives (called from socket)
    const updateConversationWithMessage = useCallback((message) => {
        setConversations(prev => {
            const otherUserId = message.senderId === currentChatRef.current
                ? message.receiverId
                : message.senderId;

            const existingIndex = prev.findIndex(c =>
                c._id === otherUserId ||
                c.userInfo?._id === otherUserId
            );

            if (existingIndex >= 0) {
                const updated = [...prev];
                const conv = { ...updated[existingIndex] };

                conv.lastMessage = {
                    _id: message._id,
                    message: message.message,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    status: message.status,
                    isDeleted: message.isDeleted || false,
                    createdAt: message.createdAt
                };

                // Increment unread only if message is FROM someone else AND we're NOT in that chat
                const isViewingThisChat = currentChatRef.current === message.senderId;
                if (!isViewingThisChat) {
                    conv.unreadCount = (conv.unreadCount || 0) + 1;
                }

                updated.splice(existingIndex, 1);
                updated.unshift(conv); // move to top
                return updated;
            }

            // New conversation — fetch fresh data to get userInfo
            fetchConversations(true);
            return prev;
        });
    }, []);

    // Clear unread count for a specific conversation
    const clearUnreadCount = useCallback((otherUserId) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv._id === otherUserId || conv.userInfo?._id === otherUserId) {
                    return { ...conv, unreadCount: 0 };
                }
                return conv;
            })
        );
    }, []);

    // Update message status in conversation preview
    const updateConversationMessageStatus = useCallback((messageId, status) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.lastMessage?._id === messageId) {
                    return {
                        ...conv,
                        lastMessage: { ...conv.lastMessage, status }
                    };
                }
                return conv;
            })
        );
    }, []);

    // ─── Update user profile info in conversations (real-time) ───
    const updateUserProfileInConversations = useCallback((userId, profileData) => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv._id === userId || conv.userInfo?._id === userId) {
                    return {
                        ...conv,
                        userInfo: { ...conv.userInfo, ...profileData }
                    };
                }
                return conv;
            })
        );
    }, []);

    // ─── Centralized Audio Service ───
    const [activeAudioId, setActiveAudioId] = useState(null);
    const audioServiceRef = useRef({
        activeSound: null,
        playbackStatusUpdate: null,
    });

    const stopAudio = useCallback(async () => {
        const svc = audioServiceRef.current;
        if (svc.activeSound) {
            try {
                await svc.activeSound.unloadAsync();
            } catch (err) { /* ignore cleanup errors */ }
            svc.activeSound = null;
            setActiveAudioId(null);
            if (svc.playbackStatusUpdate) svc.playbackStatusUpdate({ isPlaying: false, positionMillis: 0 });
        }
    }, []);

    const playAudio = useCallback(async (uri, id, onStatusUpdate) => {
        const svc = audioServiceRef.current;
        if (activeAudioId !== id) await stopAudio();

        if (!svc.activeSound) {
            try {
                const { Audio } = require("expo-av");
                const { sound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true },
                    (status) => {
                        if (svc.playbackStatusUpdate) svc.playbackStatusUpdate(status);
                        if (status.didJustFinish) stopAudio();
                    }
                );
                svc.activeSound = sound;
                setActiveAudioId(id);
            } catch (err) {
                console.log("Audio play error:", err);
                return;
            }
        } else {
            await svc.activeSound.playAsync();
        }
        svc.playbackStatusUpdate = onStatusUpdate;
    }, [stopAudio, activeAudioId]);

    const pauseAudio = useCallback(async () => {
        const svc = audioServiceRef.current;
        if (svc.activeSound) await svc.activeSound.pauseAsync();
    }, []);

    return (
        <ChatContext.Provider value={{
            conversations,
            loadingConversations,
            fetchConversations,
            updateConversationWithMessage,
            clearUnreadCount,
            updateConversationMessageStatus,
            updateUserProfileInConversations,
            setCurrentChat,
            getCurrentChat,
            getCachedMessages,
            setCachedMessages,
            addMessageToCache,
            syncMessageToCache,
            playAudio,
            pauseAudio,
            stopAudio,
            activeAudioId
        }}>
            {children}
        </ChatContext.Provider>
    );
};
