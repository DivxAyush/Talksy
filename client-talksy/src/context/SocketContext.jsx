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

    const {
        updateConversationWithMessage,
        updateConversationMessageStatus,
        updateUserProfileInConversations,
        fetchConversations,
        getCurrentChat
    } = useContext(ChatContext);

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

    // ─── Centralized event registration (prevents duplicate listeners) ───
    const registerSocketEvents = useCallback((sock) => {
        // Remove ALL previous listeners before re-registering (prevents duplicates)
        sock.removeAllListeners("getOnlineUsers");
        sock.removeAllListeners("newMessage");
        sock.removeAllListeners("message_status_update");
        sock.removeAllListeners("messages_read");
        sock.removeAllListeners("message_deleted");
        sock.removeAllListeners("profile_updated");
        sock.removeAllListeners("typing_start");
        sock.removeAllListeners("typing_stop");

        // ─── Online Users ───
        sock.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
        });

        // ─── New Message ───
        sock.on("newMessage", async (message) => {
            console.log("[Socket] newMessage received:", message._id);
            
            // Forward to chat screen handler if registered
            if (messageHandlerRef.current) {
                messageHandlerRef.current(message);
            }
            // Update conversations list
            updateConversationWithMessage(message);

            // 📲 Show local notification if NOT viewing sender's chat
            const currentChat = getCurrentChat();
            if (message.senderId !== currentChat) {
                try {
                    const senderName = message.senderName || "New Message";
                    await showLocalNotification(
                        senderName,
                        message.message || "Sent you a message",
                        {
                            type: "new_message",
                            senderId: message.senderId,
                        }
                    );
                } catch (err) {
                    console.log("[Socket] Local notification error:", err);
                }
            }
        });

        // ─── Message Status Update (sent → delivered) ───
        sock.on("message_status_update", ({ messageId, status }) => {
            if (statusHandlerRef.current) {
                statusHandlerRef.current(messageId, status);
            }
            updateConversationMessageStatus(messageId, status);
        });

        // ─── Messages Read ───
        sock.on("messages_read", ({ messageIds, status }) => {
            if (readHandlerRef.current) {
                readHandlerRef.current(messageIds, status);
            }
            // Update last message status in conversations
            messageIds.forEach(id => {
                updateConversationMessageStatus(id, status);
            });
        });

        // ─── Message Deleted ───
        sock.on("message_deleted", ({ messageId, deleteForEveryone }) => {
            if (deleteHandlerRef.current) {
                deleteHandlerRef.current(messageId, deleteForEveryone);
            }
        });

        // ─── Profile Updated (real-time) ───
        sock.on("profile_updated", (data) => {
            // Update conversations list
            updateUserProfileInConversations(data.userId, {
                name: data.name,
                username: data.username,
                profilePic: data.profilePic,
                about: data.about,
            });
            // Forward to chat screen if open
            if (profileUpdateHandlerRef.current) {
                profileUpdateHandlerRef.current(data);
            }
        });

        // ─── Typing Indicators ───
        sock.on("typing_start", ({ senderId }) => {
            setTypingUsers(prev => ({ ...prev, [senderId]: true }));
        });

        sock.on("typing_stop", ({ senderId }) => {
            setTypingUsers(prev => {
                const next = { ...prev };
                delete next[senderId];
                return next;
            });
        });
    }, [updateConversationWithMessage, updateConversationMessageStatus, updateUserProfileInConversations, fetchConversations, getCurrentChat]);

    // ─── Handle reconnect recovery ───
    const handleReconnect = useCallback(async () => {
        console.log("[Socket] Reconnected — recovering state...");
        const userId = userIdRef.current;
        if (!userId) return;

        // 1. Re-fetch conversations to get any missed messages
        fetchConversations(true);

        // 2. Mark pending messages as delivered
        try {
            await axios.post(`${SERVER_URL}/api/messages/mark-delivered`, {
                userId
            });
        } catch (err) {
            console.log("[Socket] Mark delivered on reconnect error:", err.message);
        }

        // 3. Clear stale typing indicators (they're definitely wrong after reconnect)
        setTypingUsers({});
    }, [fetchConversations]);

    // ─── Main socket connection lifecycle ───
    useEffect(() => {
        let newSocket = null;

        const connectSocket = async () => {
            if (!isLoggedIn) {
                // Logged out — cleanup
                if (socketRef.current) {
                    console.log("[Socket] Logging out — disconnecting");
                    socketRef.current.removeAllListeners();
                    socketRef.current.close();
                    socketRef.current = null;
                }
                setSocket(null);
                setOnlineUsers([]);
                setTypingUsers({});
                return;
            }

            // Prevent double connection attempts
            if (isConnectingRef.current) {
                console.log("[Socket] Already connecting, skipping");
                return;
            }
            isConnectingRef.current = true;

            try {
                const userStr = await AsyncStorage.getItem("user");
                if (!userStr) {
                    isConnectingRef.current = false;
                    return;
                }

                const user = JSON.parse(userStr);
                userIdRef.current = user._id;

                // If we already have an active connected socket, don't create a new one
                if (socketRef.current?.connected) {
                    console.log("[Socket] Already connected, reusing");
                    isConnectingRef.current = false;
                    return;
                }

                // Close any stale socket before creating new one
                if (socketRef.current) {
                    socketRef.current.removeAllListeners();
                    socketRef.current.close();
                    socketRef.current = null;
                }

                console.log("[Socket] Creating new connection for user:", user._id);
                newSocket = io(SERVER_URL, {
                    query: { userId: user._id },
                    transports: ["websocket"],
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000,
                });

                socketRef.current = newSocket;
                setSocket(newSocket);

                // ─── Connection lifecycle events ───
                newSocket.on("connect", () => {
                    console.log("[Socket] Connected:", newSocket.id);
                    isConnectingRef.current = false;
                });

                // Socket.IO v4: fires after a successful reconnection
                newSocket.io.on("reconnect", (attemptNumber) => {
                    console.log("[Socket] Reconnected after", attemptNumber, "attempts");
                    handleReconnect();
                });

                newSocket.on("disconnect", (reason) => {
                    console.log("[Socket] Disconnected:", reason);
                    // If server kicked us, don't auto-reconnect
                    if (reason === "io server disconnect") {
                        console.log("[Socket] Server disconnected us, attempting manual reconnect...");
                        newSocket.connect();
                    }
                });

                newSocket.on("connect_error", (error) => {
                    console.log("[Socket] Connection error:", error.message);
                    isConnectingRef.current = false;
                });

                // Register all event handlers
                registerSocketEvents(newSocket);

                // ─── Mark pending messages as delivered on first connect ───
                try {
                    await axios.post(`${SERVER_URL}/api/messages/mark-delivered`, {
                        userId: user._id
                    });
                } catch (err) {
                    console.log("[Socket] Mark delivered error:", err.message);
                }

            } catch (err) {
                console.log("[Socket] connectSocket error:", err);
            } finally {
                isConnectingRef.current = false;
            }
        };

        connectSocket();

        return () => {
            if (newSocket) {
                console.log("[Socket] Cleanup — removing listeners & closing");
                newSocket.removeAllListeners();
                newSocket.io.removeAllListeners();
                newSocket.close();
                socketRef.current = null;
            }
        };
    }, [isLoggedIn]);

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
