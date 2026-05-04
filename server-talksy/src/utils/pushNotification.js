import { Expo } from "expo-server-sdk";

const expo = new Expo();

/**
 * Send push notification to a user's device
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title (sender's name)
 * @param {string} body - Notification body (message text)
 * @param {object} data - Extra data to send with notification
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    // Validate the push token
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      console.log("Invalid Expo push token:", pushToken);
      return;
    }

    const message = {
      to: pushToken,
      sound: "default",
      title,
      body: body.length > 100 ? body.substring(0, 100) + "..." : body,
      data,
      priority: "high",
      // Android specific
      channelId: "talksy-messages",
      // Badge count (iOS)
      badge: 1,
    };

    const chunks = expo.chunkPushNotifications([message]);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push notification sent:", ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
};
