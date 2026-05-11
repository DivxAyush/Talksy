import React, { createContext, useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            // Normalize to strict boolean to avoid null errors
            setIsConnected(state.isConnected === true || state.isConnected === null); 
            setIsInternetReachable(state.isInternetReachable === true || state.isInternetReachable === null);
        });

        // Force initial check
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected === true || state.isConnected === null);
            setIsInternetReachable(state.isInternetReachable === true || state.isInternetReachable === null);
        });

        return () => unsubscribe();
    }, []);

    return (
        <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
            {children}
        </NetworkContext.Provider>
    );
};
