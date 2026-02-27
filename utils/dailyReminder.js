import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { database } from "../database/database";

const DAILY_REMINDER_TIME_KEY = "@Schoolify:dailyReminderTime";
const DAILY_REMINDER_ENABLED_KEY = "@Schoolify:dailyReminderEnabled";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions for notifications
const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  return status === "granted";
};

// Get today's task count for smarter notifications
const getTodayTaskCount = async () => {
  try {
    const tasks = await database.collections.get("tasks").query().fetch();
    const today = new Date();
    const todayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString();
    });
    return todayTasks.length;
  } catch (error) {
    console.error("Error getting today's task count:", error);
    return 0;
  }
};

export const scheduleDailyReminder = async (hour, minute) => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Notification permissions not granted");
    }

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Get today's task count for smarter message
    const taskCount = await getTodayTaskCount();
    const notificationBody =
      taskCount > 0
        ? `You have ${taskCount} task${taskCount !== 1 ? "s" : ""} today! 📋`
        : "No tasks for today. Enjoy your day! 🎉";

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Reminder",
        body: notificationBody,
        data: { type: "daily-reminder" },
      },
      trigger: {
        type: "daily",
        hour: hour,
        minute: minute,
        channelId: "daily-reminders",
      },
    });

    // Save the reminder time to WatermelonDB
    const reminderPrefs = database.collections.get("reminder_prefs");
    const existing = await reminderPrefs.query().fetch();

    await database.write(async () => {
      if (existing.length > 0) {
        await existing[0].update((pref) => {
          pref.hour = hour;
          pref.minute = minute;
          pref.enabled = true;
        });
      } else {
        await reminderPrefs.create((pref) => {
          pref.hour = hour;
          pref.minute = minute;
          pref.enabled = true;
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Error scheduling daily reminder:", error);
    throw error;
  }
};

export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Update the reminder preferences in WatermelonDB
    const reminderPrefs = database.collections.get("reminder_prefs");
    const existing = await reminderPrefs.query().fetch();

    if (existing.length > 0) {
      await database.write(async () => {
        await existing[0].update((pref) => {
          pref.enabled = false;
        });
      });
    }

    return true;
  } catch (error) {
    console.error("Error cancelling daily reminder:", error);
    throw error;
  }
};

export const getScheduledReminder = async () => {
  try {
    const reminderPrefs = database.collections.get("reminder_prefs");
    const prefs = await reminderPrefs.query().fetch();

    if (prefs.length > 0 && prefs[0].enabled) {
      return {
        hour: prefs[0].hour,
        minute: prefs[0].minute,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting scheduled reminder:", error);
    return null;
  }
};

// Format time for display (e.g., "8:30 AM")
export const formatTimeDisplay = (hour, minute) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Initialize notification channels (Android)
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("daily-reminders", {
    name: "Daily Reminders",
    importance: Notifications.AndroidImportance.MAX,
    sound: true,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#4F46E5",
    enableVibrate: true,
  });
}
