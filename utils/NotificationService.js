import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // Failed to get push token for push notification!
      return null;
    }

    try {
      const projectId = "be36c56d-4cc6-4068-ab56-b0ed27cef796";
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    // Must use physical device for Push Notifications
  }

  return token;
}

export async function schedulePushNotification(
  title,
  body,
  data = {},
  date = null,
) {
  try {
    // If no date is provided, default to 1 second from now
    const dueDateTime = new Date(date);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: dueDateTime,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification taps
const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;
  // Notification tapped with data: ${data}
  // Handle navigation or other actions based on notification data
};

// Add notification response listener
const notificationListener =
  Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

// Cleanup function to remove listeners
export function cleanupNotificationListeners() {
  if (notificationListener) {
    notificationListener.remove();
  }
}

export default {
  registerForPushNotificationsAsync,
  schedulePushNotification,
  cleanupNotificationListeners,
};
