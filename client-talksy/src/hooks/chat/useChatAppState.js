import { useEffect } from "react";
import { AppState } from "react-native";

export const useChatAppState = (senderId, receiverId, fetchMessages, setMessages) => {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active" && senderId && receiverId) {
        setMessages(prev => {
          const newestMsg = prev[0];
          if (newestMsg && newestMsg.createdAt) {
            fetchMessages(1, false, newestMsg.createdAt);
          } else {
            fetchMessages(1, false);
          }
          return prev;
        });
      }
    });
    return () => { subscription.remove(); };
  }, [senderId, receiverId, fetchMessages, setMessages]);
};
