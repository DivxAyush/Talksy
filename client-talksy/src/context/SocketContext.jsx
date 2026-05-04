import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { AppState } from "react-native";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatContext } from "./ChatContext";
import { showLocalNotification } from "../utils/notificationService";
export const SocketContext = createContext();

export const SocketProvider = ({ children, isLoggedIn }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({}); // { senderId: true }

    const {
        updateConversationWithMessage,
        updateConversationMessageStatus,
        fetchConversations,
        getCurrentChat
    } = useContext(ChatContext);

    // Refs for message handlers that screens can register
    const messageHandlerRef = useRef(null);
    const statusHandlerRef = useRef(null);
    const deleteHandlerRef = useRef(null);
    const readHandlerRef = useRef(null);

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

    useEffect(() => {
        let newSocket;

        const connectSocket = async () => {
            if (isLoggedIn) {
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    newSocket = io("https://talksy-3py1.onrender.com", {
                        query: { userId: user._id },
                        transports: ["websocket"],
                        reconnection: true,
                        reconnectionAttempts: Infinity,
                        reconnectionDelay: 1000
                    });

                    setSocket(newSocket);

                    // ─── Online Users ───
                    newSocket.on("getOnlineUsers", (users) => {
                        setOnlineUsers(users);
                    });

                    // ─── New Message ───
                    newSocket.on("newMessage", async (message) => {
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
                                // Try to get sender name from conversations
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
                                console.log("Local notification error:", err);
                            }
                        }
                    });

                    // ─── Message Status Update (sent → delivered) ───
                    newSocket.on("message_status_update", ({ messageId, status }) => {
                        if (statusHandlerRef.current) {
                            statusHandlerRef.current(messageId, status);
                        }
                        updateConversationMessageStatus(messageId, status);
                    });

                    // ─── Messages Read ───
                    newSocket.on("messages_read", ({ messageIds, status }) => {
                        if (readHandlerRef.current) {
                            readHandlerRef.current(messageIds, status);
                        }
                        // Update last message status in conversations
                        messageIds.forEach(id => {
                            updateConversationMessageStatus(id, status);
                        });
                    });

                    // ─── Message Deleted ───
                    newSocket.on("message_deleted", ({ messageId, deleteForEveryone }) => {
                        if (deleteHandlerRef.current) {
                            deleteHandlerRef.current(messageId, deleteForEveryone);
                        }
                    });

                    // ─── Typing Indicators ───
                    newSocket.on("typing_start", ({ senderId }) => {
                        setTypingUsers(prev => ({ ...prev, [senderId]: true }));
                    });

                    newSocket.on("typing_stop", ({ senderId }) => {
                        setTypingUsers(prev => {
                            const next = { ...prev };
                            delete next[senderId];
                            return next;
                        });
                    });

                    // Refresh conversations on reconnect
                    newSocket.on("reconnect", () => {
                        fetchConversations();
                    });
                }
            } else {
                if (socket) {
                    socket.close();
                    setSocket(null);
                    setOnlineUsers([]);
                    setTypingUsers({});
                }
            }
        };

        connectSocket();

        return () => {
            if (newSocket) newSocket.close();
        };
    }, [isLoggedIn]);

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
            unregisterReadHandler
        }}>
            {children}
        </SocketContext.Provider>
    );
};
