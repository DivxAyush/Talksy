import { useState, useRef, useCallback, useContext } from "react";
import axios from "axios";
import { ChatContext } from "../../context/ChatContext";
import { mergeMessages } from "../../utils/chat/messageHelpers";
import { getOfflineQueue } from "../../utils/chat/offlineQueue";

const API = "https://talksy-3py1.onrender.com/api/messages";

export const useChatMessages = (senderId, receiverId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const isFetchingRef = useRef(false);
  const requestVersionRef = useRef(0);
  const processedReadIdsRef = useRef(new Set());

  const { getCachedMessages, syncMessageToCache } = useContext(ChatContext);

  const fetchMessages = useCallback(async (pg = 1, append = false, afterTimestamp = null) => {
    const version = ++requestVersionRef.current;
    
    try {
      const queue = await getOfflineQueue();
      const localQueue = queue.filter(m => m.senderId === senderId && m.receiverId === receiverId);

      if (pg === 1 && !append && !afterTimestamp && senderId) {
        const cached = getCachedMessages(senderId, receiverId);
        if (cached && cached.messages.length > 0 && (Date.now() - cached.lastFetchTime) < 60000) {
          setMessages(mergeMessages(cached.messages, localQueue));
          setHasMore(cached.hasMore);
          setPage(cached.page);
          setLoading(false);
          return;
        }
      }

      if (isFetchingRef.current && !afterTimestamp) return;
      isFetchingRef.current = true;
      if (pg > 1) setLoadingMore(true);
      
      if (!senderId || !receiverId) {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      let url = `${API}/${senderId}/${receiverId}?page=${pg}&limit=50`;
      if (afterTimestamp) url += `&after=${encodeURIComponent(afterTimestamp)}`;

      const { data } = await axios.get(url);
      
      // Cancel if a newer request has started
      if (version !== requestVersionRef.current) return;

      if (data.success) {
        const incoming = data.messages.reverse();
        setMessages(prev => {
           let merged = mergeMessages(prev, incoming, append || !!afterTimestamp);
           if (pg === 1) {
              syncMessageToCache(senderId, receiverId, merged);
           }
           // Always include offline queue when showing messages
           merged = mergeMessages(merged, localQueue);
           return merged;
        });
        
        if (!afterTimestamp) {
          setHasMore(data.pagination?.hasMore || false);
          setPage(pg);
        }

        // Memory Cleanup
        if (processedReadIdsRef.current.size > 1000) {
          const arr = Array.from(processedReadIdsRef.current);
          processedReadIdsRef.current = new Set(arr.slice(500));
        }
      }
    } catch (err) {
      console.log("[useChatMessages] Fetch error:", err);
    } finally { 
      if (version === requestVersionRef.current) {
        isFetchingRef.current = false;
        setLoading(false); 
        setLoadingMore(false); 
      }
    }
  }, [senderId, receiverId, getCachedMessages, syncMessageToCache]);

  return {
    messages,
    setMessages,
    loading,
    loadingMore,
    page,
    hasMore,
    fetchMessages,
    processedReadIdsRef
  };
};
