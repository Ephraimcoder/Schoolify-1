import { database } from "../database/database";

/**
 * Check if backup is enabled in user preferences
 */
export const isBackupEnabled = async () => {
  try {
    const backupPrefs = database.collections.get("backup_prefs");
    const prefs = await backupPrefs.query().fetch();

    if (prefs.length > 0) {
      return prefs[0].enabled;
    }

    // Default to enabled if no preference exists
    return true;
  } catch (error) {
    console.error("Error checking backup preference:", error);
    return true; // Default to enabled on error
  }
};
