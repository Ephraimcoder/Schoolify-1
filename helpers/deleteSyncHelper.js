import { Q } from "@nozbe/watermelondb";
import { database } from "../database/database";
import { appwriteSyncService } from "../services/appwriteSyncService";

/**
 * Get tasks that need to be deleted from Appwrite
 * - Uses WatermelonDB's deleted records functionality
 * - Safe comparison method that prevents mass deletion on fresh installs
 */
export const getTasksToDeleteFromAppwrite = async (userId) => {
  try {
    const tasksCollection = database.collections.get("tasks");

    // Get all Appwrite tasks
    const appwriteTasks =
      await appwriteSyncService.fetchTasksFromAppwrite(userId);

    // Method 1: Try to get recently deleted records
    let recentlyDeletedTasks = [];
    try {
      // WatermelonDB doesn't have deletedRecords() on collection
      // We need to query for deleted records differently
      recentlyDeletedTasks = await tasksCollection
        .query(Q.where("user_id", userId || ""))
        .fetch();

      // Filter for records that are marked as deleted
      recentlyDeletedTasks = recentlyDeletedTasks.filter((task) => {
        // Check if task is deleted (WatermelonDB internal property)
        return task._raw && task._raw._status === "deleted";
      });

      console.log(
        `Found ${recentlyDeletedTasks.length} recently deleted records`
      );
    } catch (error) {
      console.log(`Failed to get deleted records: ${error.message}`);
    }

    // Method 2: Safe comparison method (uncommented for testing)
    // Get all active local tasks
    const activeLocalTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    // SAFETY CHECK: Prevent mass deletion on fresh installs
    if (activeLocalTasks.length === 0 && appwriteTasks.length > 0) {
      console.warn(
        "⚠️ Local database is empty but Appwrite has tasks. This appears to be a fresh install or device reset."
      );
      console.warn("🛡️ Skipping mass deletion to prevent data loss");
      console.warn(
        `📊 Appwrite tasks: ${appwriteTasks.length}, Local tasks: 0`
      );

      // Only use recently deleted records in this scenario (if available)
      if (recentlyDeletedTasks.length > 0) {
        console.log(
          `✅ Only processing ${recentlyDeletedTasks.length} recently deleted tasks`
        );
        return recentlyDeletedTasks.filter((task) => task.appwriteId);
      }

      return []; // Skip all deletions on fresh install
    }

    // Normal operation: Find tasks that exist in Appwrite but not locally
    const tasksToDelete = appwriteTasks.filter((appwriteTask) => {
      return !activeLocalTasks.some(
        (localTask) => localTask.appwriteId === appwriteTask.$id
      );
    });

    // Combine both methods for maximum reliability
    // deletedRecords() gives us recently deleted ones with full context
    // Comparison method catches any missed ones
    const allTasksToDelete = [
      ...tasksToDelete,
      ...recentlyDeletedTasks.filter(
        (deletedTask) =>
          deletedTask.appwriteId &&
          !tasksToDelete.some(
            (appwriteTask) => appwriteTask.$id === deletedTask.appwriteId
          )
      ),
    ];

    console.log(
      `Found ${allTasksToDelete.length} total tasks to delete from Appwrite`
    );
    console.log(`  - ${tasksToDelete.length} from comparison method`);
    console.log(`  - ${recentlyDeletedTasks.length} from deleted records`);

    return allTasksToDelete;
  } catch (error) {
    console.error("Error getting tasks to delete:", error);
    throw error;
  }
};

/**
 * Delete tasks from Appwrite that were deleted locally
 */
export const syncDeletedTasksToAppwrite = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log("🗑️ Syncing deleted tasks to Appwrite...");

    // Get tasks that need to be deleted from Appwrite
    const tasksToDelete = await getTasksToDeleteFromAppwrite(userId);

    if (tasksToDelete.length === 0) {
      console.log("✅ No tasks to delete from Appwrite");
      return { success: true, deleted: 0 };
    }

    let deletedCount = 0;
    let failedCount = 0;

    // Delete each task from Appwrite
    for (const appwriteTask of tasksToDelete) {
      try {
        console.log(`🗑️ Deleting task from Appwrite: ${appwriteTask.title}`);
        await appwriteSyncService.deleteTaskFromAppwrite(appwriteTask.$id);
        deletedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to delete task "${appwriteTask.title}":`,
          error
        );
        failedCount++;
      }
    }

    console.log(
      `🗑️ Delete sync completed: ${deletedCount} deleted, ${failedCount} failed`
    );

    return {
      success: failedCount === 0,
      deleted: deletedCount,
      failed: failedCount,
    };
  } catch (error) {
    console.error("❌ Failed to sync deleted tasks:", error);
    throw error;
  }
};
