import { useEffect, useRef, useCallback, useContext } from "react";
import { SocketContext } from "../../context/SocketContext";
import { mergeMessages } from "../../utils/chat/messageHelpers";

export const useRealtimeSocket = (receiverId, setMessages, processedReadIdsRef) => {
  const { 
    socket, 
    registerMessageHandler, unregisterMessageHandler,
    registerStatusHandler, unregisterStatusHandler,
    registerDeleteHandler, unregisterDeleteHandler,
    registerReadHandler, unregisterReadHandler
  } = useContext(SocketContext);

  const incomingBufferRef = useRef([]);
  const batchTimerRef = useRef(null);

  const flushIncomingBuffer = useCallback(() => {
    if (incomingBufferRef.current.length === 0) return;
    const batch = [...incomingBufferRef.current];
    incomingBufferRef.current = [];
    
    setMessages(prev => mergeMessages(prev, batch));
    
    if (socket) {
      const unreadIds = batch
        .filter(msg => msg.senderId === receiverId && !processedReadIdsRef.current.has(msg._id))
        .map(msg => {
           processedReadIdsRef.current.add(msg._id);
           return msg._id;
        });
      if (unreadIds.length > 0) {
        socket.emit("message_read", { messageIds: unreadIds, senderId: receiverId });
      }
    }
    batchTimerRef.current = null;
  }, [socket, receiverId, setMessages, processedReadIdsRef]);

  useEffect(() => {
    registerMessageHandler((msg) => {
      if (msg.senderId === receiverId) {
        incomingBufferRef.current.push(msg);
        if (!batchTimerRef.current) {
          batchTimerRef.current = setTimeout(flushIncomingBuffer, 100);
        }
      }
    });

    registerStatusHandler((msgIdOrIds, status) => {
      const ids = Array.isArray(msgIdOrIds) ? msgIdOrIds : [msgIdOrIds];
      setMessages(prev => prev.map(m => ids.includes(m._id) ? { ...m, status } : m));
    });

    registerDeleteHandler((msgId, forEveryone) => {
      if (forEveryone) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, message: "This message was deleted" } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      }
    });

    registerReadHandler((msgIds, status) => {
      setMessages(prev => prev.map(m => msgIds.includes(m._id) ? { ...m, status } : m));
    });

    return () => { 
      unregisterMessageHandler(); 
      unregisterStatusHandler(); 
      unregisterDeleteHandler(); 
      unregisterReadHandler(); 
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, [receiverId, socket, flushIncomingBuffer, registerMessageHandler, unregisterMessageHandler, registerStatusHandler, unregisterStatusHandler, registerDeleteHandler, unregisterDeleteHandler, registerReadHandler, unregisterReadHandler, setMessages]);

  return { flushIncomingBuffer };
};
