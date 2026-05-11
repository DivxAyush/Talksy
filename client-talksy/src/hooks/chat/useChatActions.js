import { useState, useCallback, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { ChatContext } from "../../context/ChatContext";
import { SocketContext } from "../../context/SocketContext";
import { NetworkContext } from "../../context/NetworkContext";
import { mergeMessages } from "../../utils/chat/messageHelpers";
import { enqueueMessage, dequeueMessage, getOfflineQueue, processQueueWithLock } from "../../utils/chat/offlineQueue";

const API = "https://talksy-3py1.onrender.com/api/messages";

export const useChatActions = (senderId, receiverId, setMessages, replyMsg, setReplyMsg, text, setText, textRef) => {
  const [sending, setSending] = useState(false);
  const { syncMessageToCache } = useContext(ChatContext);
  const { socket } = useContext(SocketContext);
  const { isConnected } = useContext(NetworkContext);
  
  const isConnectedRef = useRef(isConnected);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // Process offline queue
  const processQueue = useCallback(async () => {
    if (!isConnectedRef.current) return;
    
    processQueueWithLock(async () => {
      const queue = await getOfflineQueue();
      if (queue.length === 0) return;

      for (const msg of queue) {
        if (msg.senderId === senderId && msg.receiverId === receiverId) {
           try {
             const payload = { senderId, receiverId, message: msg.message, clientId: msg.clientId, messageType: msg.messageType, mediaUrl: msg.mediaUrl };
             if (msg.replyToMessage) payload.replyTo = msg.replyToMessage._id;
             
             const { data } = await axios.post(`${API}/send-message`, payload);
             if (data.success) {
               await dequeueMessage(msg.clientId);
               setMessages(prev => prev.map(m => m.clientId === msg.clientId ? data.data : m));
               syncMessageToCache(senderId, receiverId, data.data);
             }
           } catch (err) {
             console.log("[useChatActions] Queue process failed:", err.message);
           }
        }
      }
    });
  }, [senderId, receiverId, setMessages, syncMessageToCache]);

  useEffect(() => {
    if (isConnected) {
      processQueue();
    }
  }, [isConnected, processQueue]);

  const sendMessage = useCallback(async (customContent = null, retryId = null) => {
    const currentText = customContent || textRef.current || text;
    if (!senderId || (!currentText.trim() && !retryId)) return;
    const msgText = currentText.trim();
    
    if (!retryId) {
      setText("");
      textRef.current = "";
    }

    const tempId = retryId || `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      clientId: tempId,
      senderId,
      receiverId,
      message: msgText,
      status: "pending",
      createdAt: new Date().toISOString(),
      messageType: "text",
      isDeleted: false,
      ...(replyMsg && { replyToMessage: replyMsg })
    };

    if (!retryId) {
      setMessages(prev => mergeMessages(prev, [optimisticMsg]));
      setReplyMsg(null);
    } else {
      setMessages(prev => prev.map(m => (m.clientId === tempId || m._id === tempId) ? { ...m, status: "pending", message: msgText } : m));
    }

    if (!isConnectedRef.current) {
       await enqueueMessage(optimisticMsg);
       return;
    }

    setSending(true);
    try {
      const payload = { senderId, receiverId, message: msgText, clientId: tempId };
      if (optimisticMsg.replyToMessage) payload.replyTo = optimisticMsg.replyToMessage._id;
      
      const { data } = await axios.post(`${API}/send-message`, payload);
      if (data.success) {
        await dequeueMessage(tempId);
        setMessages(prev => prev.map(m => m.clientId === tempId ? data.data : m));
        syncMessageToCache(senderId, receiverId, data.data);
      }
    } catch (err) {
      console.log("[useChatActions] Send failed:", err.message);
      setMessages(prev => prev.map(m => (m.clientId === tempId) ? { ...m, status: "failed" } : m));
    } finally {
      setSending(false);
    }
  }, [senderId, receiverId, setMessages, replyMsg, setReplyMsg, text, setText, textRef, syncMessageToCache]);

  const retryMessage = useCallback((item) => {
    sendMessage(item.message, item.clientId || item._id);
  }, [sendMessage]);

  return { sendMessage, retryMessage, sending };
};
