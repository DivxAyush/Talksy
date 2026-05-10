import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { AppState } from "react-native";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ChatContext } from "./ChatContext";
import { showLocalNotification } from "../utils/notificationService";
export const SocketContext = createContext();

const SERVER_URL = "https://talksy-3py1.onrender.com";

export const SocketProvider = ({ children, isLoggedIn }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({}); // { senderId: true }
    
    // Refs for stable references
    const socketRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const isConnectingRef = useRef(false);
    const userIdRef = useRef(null);
    const typingTimeoutsRef = useRef({});

    const {
        updateConversationWithMessage,
        updateConversationMessageStatus,
        updateUserProfileInConversations,
        fetchConversations,
        getCurrentChat
    } = useContext(ChatContext);

    // ─── Cleanup all typing timeouts on unmount ───
    useEffect(() => {
        return () => {
            Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
        };
    }, []);

    // ─── Handler refs for screens to register callbacks ───
    const messageHandlerRef = useRef(null);
    const statusHandlerRef = useRef(null);
    const deleteHandlerRef = useRef(null);
    const readHandlerRef = useRef(null);
    const profileUpdateHandlerRef = useRef(null);

    // Register/unregister handlers from chat screen
    const registerMessageHandler = useCallback((handler) => {
        messageHandlerRef.current = handler;
    }, []);

    const unregisterMessageHandler = useCallback(() => {
        messageHandlerRef.current = null;
    }, []);

    const registerStatusHandler = useCallback((handler) => {
        statusHandlerRef.current = handler;
    }, []);

    const unregisterStatusHandler = useCallback(() => {
        statusHandlerRef.current = null;
    }, []);

    const registerDeleteHandler = useCallback((handler) => {
        deleteHandlerRef.current = handler;
    }, []);

    const unregisterDeleteHandler = useCallback(() => {
        deleteHandlerRef.current = null;
    }, []);

    const registerReadHandler = useCallback((handler) => {
        readHandlerRef.current = handler;
    }, []);

    const unregisterReadHandler = useCallback(() => {
        readHandlerRef.current = null;
    }, []);

    const registerProfileUpdateHandler = useCallback((handler) => {
        profileUpdateHandlerRef.current = handler;
    }, []);

    const unregisterProfileUpdateHandler = useCallback(() => {
        profileUpdateHandlerRef.current = null;
    }, []);

    // ─── Scoped app-event cleanup helper ───
    const cleanupSocketListeners = useCallback((sock) => {
        if (!sock) return;
        const appEvents = [
            "getOnlineUsers", "newMessage", "message_status_update", 
            "bulk_message_status_update", "messages_read", "message_deleted", 
            "profile_updated", "typing_start", "typing_stop",
            "connect", "disconnect", "connect_error"
        ];
        appEvents.forEach(ev => sock.off(ev));
        // Also cleanup engine-level listeners we might have touched
        if (sock.io) {
            sock.io.off("reconnect");
        }
    }, []);

    // ─── Centralized event registration (prevents duplicate listeners) ───
    const registerSocketEvents = useCallback((sock) => {
        // Safe Cleanup: Only remove listeners we own
        cleanupSocketListeners(sock);

        sock.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
        });

        sock.on("newMessage", async (message) => {
            console.log("[Socket] newMessage received:", message._id);
            if (messageHandlerRef.current) messageHandlerRef.current(message);
            updateConversationWithMessage(message);

            const currentChat = getCurrentChat();
            // Use stable ref for AppState to avoid stale checks during race conditions
            const isAppBackgrounded = appStateRef.current.match(/inactive|background/);
            
            if (message.senderId !== currentChat || isAppBackgrounded) {
                try {
                    const senderName = message.senderName || "New Message";
                    await showLocalNotification(
                        senderName,
                        message.message || "Sent you a message",
                        { type: "new_message", senderId: message.senderId }
                    );
                } catch (err) {
                    console.log("[Socket] Notification error:", err);
                }
            }
        });

        sock.on("message_status_update", ({ messageId, status }) => {
            if (statusHandlerRef.current) statusHandlerRef.current(messageId, status);
            updateConversationMessageStatus(messageId, status);
        });

        sock.on("bulk_message_status_update", ({ messageIds, status }) => {
            if (statusHandlerRef.current) statusHandlerRef.current(messageIds, status);
            messageIds.forEach(id => updateConversationMessageStatus(id, status));
        });

        sock.on("messages_read", ({ messageIds, status }) => {
            if (readHandlerRef.current) readHandlerRef.current(messageIds, status);
            messageIds.forEach(id => updateConversationMessageStatus(id, status));
        });

        sock.on("message_deleted", ({ messageId, deleteForEveryone }) => {
            if (deleteHandlerRef.current) deleteHandlerRef.current(messageId, deleteForEveryone);
        });

        sock.on("profile_updated", (data) => {
            updateUserProfileInConversations(data.userId, {
                name: data.name,
                username: data.username,
                profilePic: data.profilePic,
                about: data.about,
            });
            if (profileUpdateHandlerRef.current) profileUpdateHandlerRef.current(data);
        });

        // Safe Typing Indicator with useRef-based TTL (prevents window pollution)
        sock.on("typing_start", ({ senderId }) => {
            setTypingUsers(prev => ({ ...prev, [senderId]: true }));
            if (typingTimeoutsRef.current[senderId]) clearTimeout(typingTimeoutsRef.current[senderId]);
            
            typingTimeoutsRef.current[senderId] = setTimeout(() => {
                setTypingUsers(prev => {
                    const next = { ...prev };
                    delete next[senderId];
                    return next;
                });
                delete typingTimeoutsRef.current[senderId];
            }, 5000);
        });

        sock.on("typing_stop", ({ senderId }) => {
            if (typingTimeoutsRef.current[senderId]) {
                clearTimeout(typingTimeoutsRef.current[senderId]);
                delete typingTimeoutsRef.current[senderId];
            }
            setTypingUsers(prev => {
                const next = { ...prev };
                delete next[senderId];
                return next;
            });
        });
    }, [updateConversationWithMessage, updateConversationMessageStatus, updateUserProfileInConversations, fetchConversations, getCurrentChat, cleanupSocketListeners]);

    // ─── Handle reconnect recovery ───
    const handleReconnect = useCallback(async () => {
        console.log("[Socket] Reconnected — recovering state...");
        const userId = userIdRef.current;
        if (!userId) return;

        fetchConversations(true);

        try {
            await axios.post(`${SERVER_URL}/api/messages/mark-delivered`, { userId });
        } catch (err) {
            console.log("[Socket] Mark delivered error:", err.message);
        }

        // Cleanup indicators on reconnect
        setTypingUsers({});
        Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
        typingTimeoutsRef.current = {};
    }, [fetchConversations]);

    // ─── Main socket connection lifecycle ───
    useEffect(() => {
        let newSocket = null;

        const connectSocket = async () => {
            if (!isLoggedIn) {
                if (socketRef.current) {
                    console.log("[Socket] Logging out — disconnecting");
                    socketRef.current.disconnect();
                    cleanupSocketListeners(socketRef.current);
                    socketRef.current = null;
                }
                setSocket(null);
                setOnlineUsers([]);
                setTypingUsers({});
                return;
            }

            if (isConnectingRef.current) return;
            isConnectingRef.current = true;

            try {
                const userStr = await AsyncStorage.getItem("user");
                const socketToken = await AsyncStorage.getItem("socketToken");
                if (!userStr) { isConnectingRef.current = false; return; }

                const user = JSON.parse(userStr);
                userIdRef.current = user._id;

                if (socketRef.current?.connected) {
                    isConnectingRef.current = false;
                    return;
                }

                if (socketRef.current) {
                    cleanupSocketListeners(socketRef.current);
                    socketRef.current.close();
                }

                console.log("[Socket] Connecting user:", user._id);
                newSocket = io(SERVER_URL, {
                    query: { userId: user._id },
                    auth: { token: socketToken || "" },
                    transports: ["websocket"],
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                });

                socketRef.current = newSocket;
                setSocket(newSocket);

                newSocket.on("connect", () => {
                    console.log("[Socket] Connected:", newSocket.id);
                    isConnectingRef.current = false;
                });

                newSocket.io.on("reconnect", (attempt) => {
                    console.log("[Socket] Reconnected after", attempt, "attempts");
                    handleReconnect();
                });

                newSocket.on("disconnect", (reason) => {
                    console.log("[Socket] Disconnected:", reason);
                    if (reason === "io server disconnect") newSocket.connect();
                });

                newSocket.on("connect_error", (err) => {
                    console.log("[Socket] Connection error:", err.message);
                    isConnectingRef.current = false;
                });

                registerSocketEvents(newSocket);
            } catch (err) {
                console.log("[Socket] Connection failed:", err);
            } finally {
                isConnectingRef.current = false;
            }
        };

        connectSocket();

        return () => {
            if (newSocket) {
                cleanupSocketListeners(newSocket);
                newSocket.close();
                socketRef.current = null;
            }
        };
    }, [isLoggedIn, cleanupSocketListeners]);

    // ─── AppState handling: foreground/background lifecycle ───
    useEffect(() => {
        const handleAppStateChange = async (nextAppState) => {
            const prevState = appStateRef.current;
            appStateRef.current = nextAppState;

            console.log("[AppState] Transition:", prevState, "→", nextAppState);

            // App came to foreground from background/inactive
            if (
                (prevState === "background" || prevState === "inactive") &&
                nextAppState === "active"
            ) {
                console.log("[AppState] Resuming — checking socket health...");
                const sock = socketRef.current;
                const userId = userIdRef.current;

                if (sock && !sock.connected) {
                    // Socket died while in background — force reconnect
                    console.log("[AppState] Socket disconnected, reconnecting...");
                    sock.connect();
                }

                if (sock?.connected && userId) {
                    // Socket is alive — just refresh state
                    handleReconnect();
                }

                // Clear any stale typing indicators
                setTypingUsers({});
            }

            // App going to background
            if (nextAppState === "background" || nextAppState === "inactive") {
                console.log("[AppState] Going to background");
                // Clear typing indicators — no point keeping them
                setTypingUsers({});
            }
        };

        const subscription = AppState.addEventListener("change", handleAppStateChange);
        return () => subscription?.remove();
    }, [handleReconnect]);

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers,
            typingUsers,
            registerMessageHandler,
            unregisterMessageHandler,
            registerStatusHandler,
            unregisterStatusHandler,
            registerDeleteHandler,
            unregisterDeleteHandler,
            registerReadHandler,
            unregisterReadHandler,
            registerProfileUpdateHandler,
            unregisterProfileUpdateHandler
        }}>
            {children}
        </SocketContext.Provider>
    );
};
