import { showError, showInfo } from "../utils/toast";
import { isBackupEnabled } from "./backupHelper";
import { syncDeletedTasksToAppwrite } from "./deleteSyncHelper";
import { mergeAppwriteOnlyTasks } from "./mergeSyncHelper";
import { syncUnsyncedTasksToAppwrite } from "./syncTasksHelper";

/**
 * Full intelligent sync: Sync and merge only with progress indication
 * Note: Use manual sync button for deletions
 */
export const performIntelligentSync = async (userId, onProgress) => {
  try {
    console.log(" Starting intelligent full sync...");
    showInfo("Starting sync...", 2000);

    // Step 1: Sync unsynced local tasks to Appwrite
    if (onProgress)
      onProgress({ step: "syncing", message: "Syncing local changes..." });
    const syncResults = await syncUnsyncedTasksToAppwrite(userId);

    // Step 2: Merge Appwrite-only tasks to local
    if (onProgress)
      onProgress({ step: "merging", message: "Merging cloud tasks..." });
    const mergeResults = await mergeAppwriteOnlyTasks(userId);

    const finalResults = {
      success: syncResults.success && mergeResults.success,
      localToAppwrite: syncResults,
      appwriteToLocal: mergeResults,
      deletions: { success: true, deleted: 0, failed: 0 }, // No deletions in auto sync
      summary: {
        totalCreated: syncResults.created.length,
        totalUpdated: syncResults.updated.length,
        totalDeleted: 0, // No deletions in auto sync
        totalFailed: syncResults.failed.length,
        totalMerged: mergeResults.merged,
        totalProcessed:
          syncResults.created.length +
          syncResults.updated.length +
          mergeResults.merged,
      },
    };

    // User-friendly completion message
    const { totalCreated, totalUpdated, totalMerged, totalFailed } =
      finalResults.summary;
    let message = "Sync completed";

    if (totalCreated > 0 || totalUpdated > 0 || totalMerged > 0) {
      const parts = [];
      if (totalCreated > 0) parts.push(`${totalCreated} created`);
      if (totalUpdated > 0) parts.push(`${totalUpdated} updated`);
      if (totalMerged > 0) parts.push(`${totalMerged} merged`);
      message = `Synced: ${parts.join(", ")}`;
    } else if (totalFailed > 0) {
      message = "Some items failed to sync";
    } else {
      message = "Everything is up to date";
    }

    if (onProgress) onProgress({ step: "completed", message });
    // Removed showInfo call - let the UI button handle status display

    console.log(" Intelligent sync completed:", finalResults.summary);
    return finalResults;
  } catch (error) {
    console.error(" Intelligent sync failed:", error);
    showError("Sync failed. Please try again.");
    throw error;
  }
};

// Re-export all functions for backward compatibility
export {
  isBackupEnabled,
  mergeAppwriteOnlyTasks,
  syncDeletedTasksToAppwrite,
  syncUnsyncedTasksToAppwrite,
};
