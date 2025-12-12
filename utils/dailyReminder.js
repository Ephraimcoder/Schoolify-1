import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export const scheduleDailyReminder = async (hour, minute) => {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Request permissions (if not already granted)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Generate notification ID based on time to ensure uniqueness
    const notificationId = `daily-reminder-${hour}-${minute}`;
    
    // Calculate the next occurrence of the specified time
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: '📚 Time to Schoolify!',
        body: 'Open the app to check your tasks and stay on top of your studies!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
        data: {
        type: 'daily-reminder',
        },
      },
      // Use a specific Date for the first fire to avoid immediate trigger
      trigger: scheduledTime,
    });

    // Save the reminder time
    await AsyncStorage.setItem(DAILY_REMINDER_TIME_KEY, JSON.stringify({ hour, minute }));
    await AsyncStorage.setItem(DAILY_REMINDER_ENABLED_KEY, 'true');

    return true;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return false;
  }
};

export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(DAILY_REMINDER_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('Error cancelling daily reminder:', error);
    return false;
  }
};

export const getScheduledReminder = async () => {
  try {
    const enabled = await AsyncStorage.getItem(DAILY_REMINDER_ENABLED_KEY);
    const timeStr = await AsyncStorage.getItem(DAILY_REMINDER_TIME_KEY);
    
    if (timeStr && enabled === 'true') {
      return JSON.parse(timeStr);
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
