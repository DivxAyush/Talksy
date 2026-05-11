import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "talksy_offline_queue";

export const getOfflineQueue = async () => {
    try {
        const stored = await AsyncStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.log("Failed to get offline queue", e);
        return [];
    }
};

export const enqueueMessage = async (message) => {
    try {
        const queue = await getOfflineQueue();
        const exists = queue.find(m => m.clientId === message.clientId);
        if (!exists) {
            queue.push(message);
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        }
    } catch (e) {
        console.log("Failed to enqueue message", e);
    }
};

export const dequeueMessage = async (clientId) => {
    try {
        let queue = await getOfflineQueue();
        queue = queue.filter(m => m.clientId !== clientId);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.log("Failed to dequeue message", e);
    }
};

export const clearOfflineQueue = async () => {
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
