import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { database } from '../database/database';

const DAILY_REMINDER_TIME_KEY = '@Schoolify:dailyReminderTime';
const DAILY_REMINDER_ENABLED_KEY = '@Schoolify:dailyReminderEnabled';

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
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return status === 'granted';
};

export const scheduleDailyReminder = async (hour, minute) => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Set the time for the notification
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Reminder",
        body: "Don't forget to check your tasks for today!",
        data: { type: 'daily-reminder' },
      },
      trigger: {
        type: "date",
        date: scheduledTime,
        repeats: true,
      },
    });

    // Save the reminder time to WatermelonDB
    const reminderPrefs = database.collections.get('reminder_prefs');
    const existing = await reminderPrefs.query().fetch();
    
    await database.write(async () => {
      if (existing.length > 0) {
        await existing[0].update(pref => {
          pref.hour = hour;
          pref.minute = minute;
          pref.enabled = true;
        });
      } else {
        await reminderPrefs.create(pref => {
          pref.hour = hour;
          pref.minute = minute;
          pref.enabled = true;
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    throw error;
  }
};

export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Update the reminder preferences in WatermelonDB
    const reminderPrefs = database.collections.get('reminder_prefs');
    const existing = await reminderPrefs.query().fetch();
    
    if (existing.length > 0) {
      await database.write(async () => {
        await existing[0].update(pref => {
          pref.enabled = false;
        });
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling daily reminder:', error);
    throw error;
  }
};

export const getScheduledReminder = async () => {
  try {
    const reminderPrefs = database.collections.get('reminder_prefs');
    const prefs = await reminderPrefs.query().fetch();
    
    if (prefs.length > 0 && prefs[0].enabled) {
      return {
        hour: prefs[0].hour,
        minute: prefs[0].minute
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting scheduled reminder:', error);
    return null;
  }
};

// Format time for display (e.g., "8:30 AM")
export const formatTimeDisplay = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Initialize notification channels (Android)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });
}
