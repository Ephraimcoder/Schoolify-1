import { database } from "../database/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    console.error("Error getting notification lead minutes:", error);
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
      console.warn("Failed to write lead minutes to AsyncStorage", e);
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
      console.warn("Failed to persist lead minutes to DB, continuing with AsyncStorage", dbErr);
    }

    return m;
  } catch (error) {
    console.error("Error setting notification lead minutes:", error);
    throw error;
  }
}

export const DEFAULT_NOTIFICATION_MINUTES = DEFAULT_MINUTES;
