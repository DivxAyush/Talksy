import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_USERS = "https://talksy-3py1.onrender.com/api/users";

// ─── Configure how notifications appear when app is in FOREGROUND ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Create Android notification channel (required for Android 8+) ───
export const setupNotificationChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("talksy-messages", {
      name: "Messages",
      description: "New message notifications from Talksy",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#25D366",
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

// ─── Show a local notification (for foreground messages) ───
export const showLocalNotification = async (title, body, data = {}) => {
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
};
