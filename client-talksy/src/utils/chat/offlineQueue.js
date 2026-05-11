import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "talksy_offline_queue";
const MAX_RETRIES = 5;
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory state for performance
let memoryQueue = null;
let saveTimeout = null;

const persistQueue = async () => {
    if (!memoryQueue) return;
    try {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(memoryQueue));
    } catch (e) {
        console.log("[OfflineQueue] Failed to persist", e);
    }
};

const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(persistQueue, 2000); // Debounce write pressure
};

export const getOfflineQueue = async () => {
    if (memoryQueue !== null) return [...memoryQueue];
    
    try {
        const stored = await AsyncStorage.getItem(QUEUE_KEY);
        memoryQueue = stored ? JSON.parse(stored) : [];
        
        // Initial cleanup of dead/expired messages
        const now = Date.now();
        const initialLength = memoryQueue.length;
        memoryQueue = memoryQueue.filter(m => {
            const age = now - new Date(m.createdAt || now).getTime();
            return age < EXPIRY_MS && (m.retryCount || 0) < MAX_RETRIES;
        });
        
        if (memoryQueue.length !== initialLength) debouncedSave();
        
        return [...memoryQueue];
    } catch (e) {
        console.log("Failed to get offline queue", e);
        memoryQueue = [];
        return [];
    }
};

export const enqueueMessage = async (message) => {
    await getOfflineQueue(); // Ensure initialized
    const exists = memoryQueue.find(m => m.clientId === message.clientId);
    if (!exists) {
        memoryQueue.push({ ...message, retryCount: 0, lastRetryAt: 0 });
        debouncedSave();
    }
};

export const dequeueMessage = async (clientId) => {
    await getOfflineQueue();
    const initialLen = memoryQueue.length;
    memoryQueue = memoryQueue.filter(m => m.clientId !== clientId);
    if (memoryQueue.length !== initialLen) debouncedSave();
};

export const markQueueFailure = async (clientId) => {
    await getOfflineQueue();
    const msg = memoryQueue.find(m => m.clientId === clientId);
    if (msg) {
        msg.retryCount = (msg.retryCount || 0) + 1;
        msg.lastRetryAt = Date.now();
        debouncedSave();
    }
};

export const clearOfflineQueue = async () => {
    memoryQueue = [];
    if (saveTimeout) clearTimeout(saveTimeout);
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (e) {
        console.log("Failed to clear offline queue", e);
    }
};

let isProcessing = false;
export const processQueueWithLock = async (processorFn) => {
    if (isProcessing) return;
    isProcessing = true;
    try {
        await processorFn();
    } finally {
        isProcessing = false;
    }
};
