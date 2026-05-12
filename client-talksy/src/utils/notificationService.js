import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_USERS = "https://talksy-3py1.onrender.com/api/users";

// ─── Notification Dedup & Rate Limiting State ───
const _notificationState = {
  // messageId-based dedup: prevents socket + push double notifications
  recentNotifications: new Map(), // messageId → timestamp
  // Rate limiting: prevent notification spam during rapid messages
  lastNotificationTime: 0,
  MIN_NOTIFICATION_INTERVAL: 800, // ms between notifications from same conversation
  lastNotifiedSender: null,
  // Active chat tracking (set by SocketContext/ChatContext)
  activeChatUserId: null,
  // Cleanup interval
  _cleanupTimer: null,
  MAX_DEDUP_ENTRIES: 200,
  DEDUP_TTL: 60000, // 60 seconds TTL for dedup entries
};

// ─── Start periodic dedup cleanup (called once on init) ───
const startDedupCleanup = () => {
  if (_notificationState._cleanupTimer) return;
  _notificationState._cleanupTimer = setInterval(() => {
    const now = Date.now();
    const map = _notificationState.recentNotifications;
    if (map.size > _notificationState.MAX_DEDUP_ENTRIES) {
      // Remove entries older than TTL
      for (const [key, timestamp] of map) {
        if (now - timestamp > _notificationState.DEDUP_TTL) {
          map.delete(key);
        }
      }
    }
  }, 30000); // cleanup every 30s
};

// ─── Set Active Chat (called by ChatContext/SocketContext) ───
export const setActiveChat = (userId) => {
  _notificationState.activeChatUserId = userId;
  console.log("[Notification] Active chat set:", userId || "none");
};

export const getActiveChat = () => _notificationState.activeChatUserId;

// ─── Intelligent Foreground Notification Handler ───
// This replaces the static handler with context-aware logic
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const appState = AppState.currentState;
    const activeChat = _notificationState.activeChatUserId;

    // RULE 1: If app is in background/inactive, always show
    if (appState !== "active") {
      console.log("[Notification] App backgrounded → showing notification");
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }

    // RULE 2: If app is foreground AND user is viewing the sender's chat → suppress
    if (data?.senderId && data.senderId === activeChat) {
      console.log("[Notification] Suppressed → user viewing this chat:", data.senderId);
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    // RULE 3: App is foreground but user is NOT in this chat → show subtle notification
    console.log("[Notification] Foreground, different chat → showing notification");
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// ─── Create Android notification channel (required for Android 8+) ───
export const setupNotificationChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("talksy-messages", {
      name: "Messages",
      description: "New message notifications from Talksy",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C4734A",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

// ─── Register for push notifications & get Expo push token ───
export const registerForPushNotifications = async () => {
  try {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenData.data;
    console.log("Expo Push Token:", pushToken);

    return pushToken;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
};

// ─── Save push token to server ───
export const savePushTokenToServer = async (pushToken) => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId || !pushToken) return;

    await axios.post(`${API_USERS}/push-token`, {
      userId,
      pushToken,
    });

    // Save locally to avoid re-sending same token
    await AsyncStorage.setItem("pushToken", pushToken);
    console.log("Push token saved to server");
  } catch (error) {
    console.error("Error saving push token to server:", error);
  }
};

// ─── Full init: setup channel → register → save token ───
export const initializePushNotifications = async () => {
  await setupNotificationChannel();
  startDedupCleanup(); // Start dedup memory cleanup
  const pushToken = await registerForPushNotifications();
  if (pushToken) {
    const savedToken = await AsyncStorage.getItem("pushToken");
    // Only save if token changed
    if (savedToken !== pushToken) {
      await savePushTokenToServer(pushToken);
    }
  }
  return pushToken;
};

// ─── Show a local notification (with dedup + rate limiting + active chat awareness) ───
export const showLocalNotification = async (title, body, data = {}) => {
  const messageId = data.messageId || data.senderId;
  const senderId = data.senderId;
  const now = Date.now();

  // DEDUP CHECK: Skip if this messageId was already notified
  if (messageId && _notificationState.recentNotifications.has(messageId)) {
    console.log("[Notification] Dedup skip — already notified:", messageId);
    return false;
  }

  // ACTIVE CHAT CHECK: Skip if user is currently viewing this chat
  if (senderId && senderId === _notificationState.activeChatUserId) {
    console.log("[Notification] Active chat skip — user viewing:", senderId);
    return false;
  }

  // RATE LIMIT CHECK: Throttle rapid notifications from same sender
  if (
    senderId === _notificationState.lastNotifiedSender &&
    now - _notificationState.lastNotificationTime < _notificationState.MIN_NOTIFICATION_INTERVAL
  ) {
    console.log("[Notification] Rate limited — too fast from:", senderId);
    return false;
  }

  // Mark as notified
  if (messageId) {
    _notificationState.recentNotifications.set(messageId, now);
  }
  _notificationState.lastNotificationTime = now;
  _notificationState.lastNotifiedSender = senderId;

  // Schedule notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body.length > 100 ? body.substring(0, 100) + "..." : body,
      data,
      sound: "default",
      ...(Platform.OS === "android" && { channelId: "talksy-messages" }),
    },
    trigger: null, // Show immediately
  });

  console.log("[Notification] Shown:", title, "→", body.substring(0, 30));
  return true;
};

// ─── Dismiss notifications for a specific chat (when user opens that chat) ───
export const dismissChatNotifications = async (senderId) => {
  try {
    const allNotifications = await Notifications.getPresentedNotificationsAsync();
    const toRemove = allNotifications.filter(
      n => n.request.content.data?.senderId === senderId
    );
    for (const notification of toRemove) {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
    if (toRemove.length > 0) {
      console.log("[Notification] Dismissed", toRemove.length, "notifications for chat:", senderId);
    }
  } catch (err) {
    console.log("[Notification] Dismiss error:", err.message);
  }
};

// ─── Check if a messageId has already been notified (for push+socket dedup) ───
export const isAlreadyNotified = (messageId) => {
  return _notificationState.recentNotifications.has(messageId);
};

// ─── Mark a messageId as notified (for push+socket dedup) ───
export const markAsNotified = (messageId) => {
  _notificationState.recentNotifications.set(messageId, Date.now());
};

// ─── Cleanup on logout ───
export const cleanupNotifications = () => {
  _notificationState.recentNotifications.clear();
  _notificationState.activeChatUserId = null;
  _notificationState.lastNotificationTime = 0;
  _notificationState.lastNotifiedSender = null;
  if (_notificationState._cleanupTimer) {
    clearInterval(_notificationState._cleanupTimer);
    _notificationState._cleanupTimer = null;
  }
  console.log("[Notification] Cleanup complete");
};
