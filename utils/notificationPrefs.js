import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@Schoolify/notificationLeadMinutes";
const DEFAULT_MINUTES = 15;

export async function getNotificationLeadMinutes() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = value ? parseInt(value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : DEFAULT_MINUTES;
  } catch (e) {
    return DEFAULT_MINUTES;
  }
}

export async function setNotificationLeadMinutes(minutes) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(minutes));
  } catch (e) {
    // no-op
  }
}

export const DEFAULT_NOTIFICATION_MINUTES = DEFAULT_MINUTES;
