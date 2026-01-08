import { database } from "../database/database";

const DEFAULT_MINUTES = 15; // Default reminder time in minutes

export async function getNotificationLeadMinutes() {
  try {
    const notificationPrefs = database.collections.get("notification_prefs");
    const prefs = await notificationPrefs.query().fetch();

    if (prefs.length > 0) {
      return prefs[0].lead_minutes || DEFAULT_MINUTES;
    }

    // If no preferences exist, create default
    await database.write(async () => {
      await notificationPrefs.create((pref) => {
        pref.lead_minutes = DEFAULT_MINUTES;
      });
    });

    return DEFAULT_MINUTES;
  } catch (error) {
    console.error("Error getting notification lead minutes:", error);
    return DEFAULT_MINUTES;
  }
}

export async function setNotificationLeadMinutes(minutes) {
  try {
    const notificationPrefs = database.collections.get("notification_prefs");
    const prefs = await notificationPrefs.query().fetch();

    await database.write(async () => {
      if (prefs.length > 0) {
        await prefs[0].update((pref) => {
          pref.lead_minutes = minutes;
        });
      } else {
        await notificationPrefs.create((pref) => {
          pref.lead_minutes = minutes;
        });
      }
    });
  } catch (error) {
    console.error("Error setting notification lead minutes:", error);
    throw error;
  }
}

export const DEFAULT_NOTIFICATION_MINUTES = DEFAULT_MINUTES;
