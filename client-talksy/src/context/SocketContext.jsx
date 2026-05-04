import React, { createContext, useState, useEffect, useContext } from "react";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext();

export const SocketProvider = ({ children, isLoggedIn }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        let newSocket;

        const connectSocket = async () => {
            if (isLoggedIn) {
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    newSocket = io("https://talksy-3py1.onrender.com", {
                        query: { userId: user._id }
                    });

                    setSocket(newSocket);

                    newSocket.on("getOnlineUsers", (users) => {
                        setOnlineUsers(users);
                    });
                }
            } else {
                if (socket) {
                    socket.close();
                    setSocket(null);
                    setOnlineUsers([]);
                }
            }
        };

        connectSocket();

        return () => {
            if (newSocket) newSocket.close();
        };
    }, [isLoggedIn]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
