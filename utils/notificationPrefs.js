import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../database/database";

const DEFAULT_MINUTES = 15; // Default reminder time in minutes
const ASYNC_KEY = "@ScholarFlow:notificationLeadMinutes";

export async function getNotificationLeadMinutes() {
  try {
    // Try AsyncStorage first for resilience
    const stored = await AsyncStorage.getItem(ASYNC_KEY);
    if (stored !== null) {
      const v = parseInt(stored, 10);
      if (!Number.isNaN(v)) return v;
    }

    // Fallback to DB
    const notificationPrefs = database.collections.get("notification_prefs");
    const prefs = await notificationPrefs.query().fetch();

    if (prefs.length > 0) {
      const leadMinutes = prefs[0].lead_minutes || DEFAULT_MINUTES;
      try {
        await AsyncStorage.setItem(ASYNC_KEY, String(leadMinutes));
      } catch (e) {}
      return leadMinutes;
    }

    // Create default if missing
    await database.write(async () => {
      await notificationPrefs.create((pref) => {
        pref.lead_minutes = DEFAULT_MINUTES;
      });
    });

    try {
      await AsyncStorage.setItem(ASYNC_KEY, String(DEFAULT_MINUTES));
    } catch (e) {}

    return DEFAULT_MINUTES;
  } catch (error) {
    try {
      const stored = await AsyncStorage.getItem(ASYNC_KEY);
      if (stored !== null) return parseInt(stored, 10) || DEFAULT_MINUTES;
    } catch (e) {}
    return DEFAULT_MINUTES;
  }
}

export async function setNotificationLeadMinutes(minutes) {
  try {
    const m = Number(minutes) || DEFAULT_MINUTES;
    try {
      await AsyncStorage.setItem(ASYNC_KEY, String(m));
    } catch (e) {
      showError(
        "Failed to save notification settings. Changes may not persist.",
      );
    }

    try {
      const notificationPrefs = database.collections.get("notification_prefs");
      const prefs = await notificationPrefs.query().fetch();

      await database.write(async () => {
        if (prefs.length > 0) {
          await prefs[0].update((pref) => {
            pref.lead_minutes = m;
          });
        } else {
          await notificationPrefs.create((pref) => {
            pref.lead_minutes = m;
          });
        }
      });
    } catch (dbErr) {
      showError(
        "Failed to save notification settings to database. Using local storage only.",
      );
    }

    return m;
  } catch (error) {
    showError("Failed to update notification settings. Please try again.");
    throw error;
  }
}

export const DEFAULT_NOTIFICATION_MINUTES = DEFAULT_MINUTES;
