import React, { createContext, useState, useCallback, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://talksy-3py1.onrender.com/api/messages";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const currentChatRef = useRef(null); // track which chat is currently open

    // Set which chat is currently being viewed
    const setCurrentChat = useCallback((userId) => {
        currentChatRef.current = userId;
    }, []);

    const getCurrentChat = useCallback(() => {
        return currentChatRef.current;
    }, []);

    // Fetch conversations list from server
    const fetchConversations = useCallback(async () => {
        try {
            setLoadingConversations(true);
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) return;

            const { data } = await axios.get(`${API}/conversations/${userId}`);
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (err) {
            console.log("Error fetching conversations:", err.message);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

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

                // If the message is from someone else & we're NOT in that chat, increment unread
                const myUserId = currentChatRef.current;
                if (message.senderId !== myUserId && currentChatRef.current !== message.senderId) {
                    conv.unreadCount = (conv.unreadCount || 0) + 1;
                }

                updated.splice(existingIndex, 1);
                updated.unshift(conv); // move to top
                return updated;
            }

            // New conversation — will be populated on next fetchConversations
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

    return (
        <ChatContext.Provider value={{
            conversations,
            loadingConversations,
            fetchConversations,
            updateConversationWithMessage,
            clearUnreadCount,
            updateConversationMessageStatus,
            setCurrentChat,
            getCurrentChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};
