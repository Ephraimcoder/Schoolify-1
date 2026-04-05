import { database } from "../database/database";

const DEFAULT_MINUTES = 15; // Default reminder time in minutes

export async function getNotificationLeadMinutes() {
  try {
    const notificationPrefs = database.collections.get("notification_prefs");
    const prefs = await notificationPrefs.query().fetch();

    console.log("🔍 Notification prefs found:", prefs.length, prefs);

    if (prefs.length > 0) {
      const leadMinutes = prefs[0].lead_minutes || DEFAULT_MINUTES;
      console.log(
        "📱 Using saved lead minutes:",
        prefs[0].lead_minutes,
        "fallback:",
        leadMinutes,
      );
      return leadMinutes;
    }

    // If no preferences exist, create default
    console.log("⚠️ No prefs found, creating default:", DEFAULT_MINUTES);
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
    console.log("🔧 Setting notification lead minutes to:", minutes);
    const notificationPrefs = database.collections.get("notification_prefs");
    const prefs = await notificationPrefs.query().fetch();

    console.log("📋 Current prefs before update:", prefs.length, prefs);

    await database.write(async () => {
      if (prefs.length > 0) {
        console.log(
          "📝 Updating existing pref from",
          prefs[0].lead_minutes,
          "to",
          minutes,
        );
        await prefs[0].update((pref) => {
          pref.lead_minutes = minutes;
        });
      } else {
        console.log("➕ Creating new pref with", minutes);
        await notificationPrefs.create((pref) => {
          pref.lead_minutes = minutes;
        });
      }
    });

    console.log("✅ Successfully saved notification lead minutes:", minutes);
  } catch (error) {
    console.error("Error setting notification lead minutes:", error);
    throw error;
  }
}

export const DEFAULT_NOTIFICATION_MINUTES = DEFAULT_MINUTES;
