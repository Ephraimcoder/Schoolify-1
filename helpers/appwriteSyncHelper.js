import { Q } from "@nozbe/watermelondb";
import { database } from "../database/database";
import { appwriteSyncService } from "../services/appwriteSyncService";
import { showError, showSuccess } from "../utils/toast";

/**
 * Helper functions for Appwrite sync operations
 * Handles intelligent sync that only processes unsynced/changed tasks
 */

/**
 * Get tasks that need to be synced to Appwrite
 * - Tasks without appwriteId (never synced)
 * - Tasks with local changes (last_modified > last_synced_at)
 * - Tasks marked for deletion
 */
export const getUnsyncedTasks = async (userId) => {
  try {
    const tasksCollection = database.collections.get("tasks");
    const allTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    // Filter tasks that need syncing
    const unsyncedTasks = allTasks.filter((task) => {
      // Never synced tasks (no appwriteId)
      if (!task.appwriteId) {
        return true;
      }

      // Modified tasks (last_modified > last_synced_at)
      const lastModified = task._raw.last_modified || 0;
      const lastSynced = task.lastSyncedAt?.getTime() || 0;

      return lastModified > lastSynced;
    });

    console.log(
      `Found ${unsyncedTasks.length} tasks that need syncing out of ${allTasks.length} total`
    );
    return unsyncedTasks;
  } catch (error) {
    console.error("Error getting unsynced tasks:", error);
    throw error;
  }
};

/**
 * Get tasks that need to be deleted from Appwrite
 * - Tasks that are marked as deleted locally but still exist in Appwrite
 */
export const getTasksToDeleteFromAppwrite = async (userId) => {
  try {
    const tasksCollection = database.collections.get("tasks");

    // Get all Appwrite tasks
    const appwriteTasks =
      await appwriteSyncService.fetchTasksFromAppwrite(userId);

    // Get all local tasks (including deleted ones)
    const localTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    // Find tasks that exist in Appwrite but not locally (deleted locally)
    const tasksToDelete = appwriteTasks.filter((appwriteTask) => {
      return !localTasks.some(
        (localTask) => localTask.appwriteId === appwriteTask.$id
      );
    });

    console.log(`Found ${tasksToDelete.length} tasks to delete from Appwrite`);
    return tasksToDelete;
  } catch (error) {
    console.error("Error getting tasks to delete:", error);
    throw error;
  }
};

/**
 * Sync only unsynced/changed tasks to Appwrite
 * Uses intelligent filtering to avoid full resync
 */
export const syncUnsyncedTasksToAppwrite = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get only tasks that need syncing
    const unsyncedTasks = await getUnsyncedTasks(userId);

    if (unsyncedTasks.length === 0) {
      showSuccess("No tasks need syncing");
      return {
        success: true,
        created: [],
        updated: [],
        failed: [],
        skipped: 0,
        message: "No tasks need syncing",
      };
    }

    const results = {
      created: [],
      updated: [],
      failed: [],
      skipped: 0,
    };

    // Process each unsynced task
    for (const task of unsyncedTasks) {
      try {
        if (task.appwriteId) {
          // Update existing task in Appwrite
          try {
            const updatedTask = await appwriteSyncService.updateTaskInAppwrite(
              task.appwriteId,
              {
                title: task.title,
                description: task.description,
                is_completed: task.isCompleted,
                categoryName: task.categoryName,
                priorityName: task.priorityName,
                due_date: task.dueDate?.getTime() || 0,
                due_time: task.dueTime?.getTime() || 0,
                alert_enabled: task.alertEnabled,
                subtasks_json: task.subtasksJson || "[]",
                itemType: task.itemType,
                last_synced_at: Date.now(),
              }
            );

            // Update local task's sync timestamp
            await updateLocalTaskSyncTimestamp(task.id);
            results.updated.push(updatedTask);
          } catch (updateError) {
            // If update fails because task doesn't exist in Appwrite, create it instead
            if (
              updateError.message.includes("not found") ||
              updateError.message.includes("404")
            ) {
              showWarning(
                `Task not found in cloud, creating instead: ${task.title}`
              );
              const createdTask =
                await appwriteSyncService.createTaskInAppwrite(
                  {
                    title: task.title,
                    description: task.description,
                    isCompleted: task.isCompleted,
                    categoryName: task.categoryName,
                    priorityName: task.priorityName,
                    dueDate: task.dueDate?.toISOString(),
                    dueTime: task.dueTime?.toISOString(),
                    alertEnabled: task.alertEnabled,
                    subTasks: task.subtasksJson
                      ? JSON.parse(task.subtasksJson)
                      : [],
                    itemType: task.itemType,
                  },
                  userId
                );

              // Update local task with new Appwrite ID
              await updateLocalTaskAppwriteId(task.id, createdTask.$id);
              results.created.push(createdTask);
            } else {
              throw updateError;
            }
          }
        } else {
          // Create new task in Appwrite
          const createdTask = await appwriteSyncService.createTaskInAppwrite(
            {
              title: task.title,
              description: task.description,
              isCompleted: task.isCompleted,
              categoryName: task.categoryName,
              priorityName: task.priorityName,
              dueDate: task.dueDate?.toISOString(),
              dueTime: task.dueTime?.toISOString(),
              alertEnabled: task.alertEnabled,
              subTasks: task.subtasksJson ? JSON.parse(task.subtasksJson) : [],
              itemType: task.itemType,
            },
            userId
          );

          // Update local task with Appwrite ID
          await updateLocalTaskAppwriteId(task.id, createdTask.$id);
          results.created.push(createdTask);
        }
      } catch (error) {
        showError(`Failed to sync task "${task.title}": ${error.message}`);
        results.failed.push({
          task: task,
          error: error.message,
        });
      }
    }

    showSuccess(
      `Sync completed: ${results.created.length} created, ${results.updated.length} updated, ${results.failed.length} failed`
    );

    return {
      success: results.failed.length === 0,
      ...results,
      message: `Synced ${results.created.length + results.updated.length} tasks successfully`,
    };
  } catch (error) {
    showError("Sync failed: " + error.message);
    throw error;
  }
};

/**
 * Update local task with Appwrite ID after creation
 */
const updateLocalTaskAppwriteId = async (taskId, appwriteId) => {
  try {
    const tasksCollection = database.collections.get("tasks");
    const task = await tasksCollection.find(taskId);

    await database.write(async () => {
      await task.update((t) => {
        t.appwriteId = appwriteId;
        t.lastSyncedAt = new Date();
      });
    });
  } catch (error) {
    showError("Error updating local task Appwrite ID: " + error.message);
    throw error;
  }
};

/**
 * Update local task's sync timestamp after successful sync
 */
const updateLocalTaskSyncTimestamp = async (taskId) => {
  try {
    const tasksCollection = database.collections.get("tasks");
    const task = await tasksCollection.find(taskId);

    await database.write(async () => {
      await task.update((t) => {
        t.lastSyncedAt = new Date();
      });
    });
  } catch (error) {
    showError("Error updating sync timestamp: " + error.message);
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
export const mergeAppwriteOnlyTasks = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get all Appwrite tasks
    const appwriteTasks =
      await appwriteSyncService.fetchTasksFromAppwrite(userId);

    // Get all local tasks
    const tasksCollection = database.collections.get("tasks");
    const localTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    // Find tasks that exist in Appwrite but not locally
    const appwriteOnlyTasks = appwriteTasks.filter((appwriteTask) => {
      return !localTasks.some(
        (localTask) =>
          localTask.appwriteId === appwriteTask.$id ||
          (localTask.title === appwriteTask.title &&
            localTask.description === appwriteTask.description)
      );
    });

    if (appwriteOnlyTasks.length === 0) {
      showSuccess("No cloud tasks to merge");
      return { success: true, merged: 0 };
    }

    // Merge Appwrite-only tasks to local DB
    await database.write(async () => {
      for (const appwriteTask of appwriteOnlyTasks) {
        await tasksCollection.create((task) => {
          task.title = appwriteTask.title;
          task.description = appwriteTask.description;
          task.isCompleted = appwriteTask.is_completed;
          task.categoryName = appwriteTask.categoryName;
          task.priorityName = appwriteTask.priorityName;
          task.itemType = appwriteTask.itemType;
          task.alertEnabled = appwriteTask.alert_enabled;
          task.subtasksJson = appwriteTask.subtasks_json;
          task.dueDate = appwriteTask.due_date
            ? new Date(appwriteTask.due_date)
            : null;
          task.dueTime = appwriteTask.due_time
            ? new Date(appwriteTask.due_time)
            : null;
          task.userId = userId;
          task.appwriteId = appwriteTask.$id;
          task.lastSyncedAt = new Date();
        });
      }
    });

    showSuccess(`Merged ${appwriteOnlyTasks.length} cloud tasks locally`);
    return { success: true, merged: appwriteOnlyTasks.length };
  } catch (error) {
    showError("Failed to merge cloud tasks: " + error.message);
    throw error;
  }
};

/**
 * Full intelligent sync: Both directions with deletion support
 */
export const performIntelligentSync = async (userId) => {
  try {
    console.log("🚀 Starting intelligent full sync...");

    // Step 1: Sync unsynced local tasks to Appwrite
    const syncResults = await syncUnsyncedTasksToAppwrite(userId);

    // Step 2: Merge Appwrite-only tasks to local
    const mergeResults = await mergeAppwriteOnlyTasks(userId);

    // Step 3: Sync deletions from local to Appwrite
    const deleteResults = await syncDeletedTasksToAppwrite(userId);

    const finalResults = {
      success:
        syncResults.success && mergeResults.success && deleteResults.success,
      localToAppwrite: syncResults,
      appwriteToLocal: mergeResults,
      deletions: deleteResults,
      summary: {
        totalCreated: syncResults.created.length,
        totalUpdated: syncResults.updated.length,
        totalDeleted: deleteResults.deleted,
        totalFailed: syncResults.failed.length + deleteResults.failed,
        totalMerged: mergeResults.merged,
        totalProcessed:
          syncResults.created.length +
          syncResults.updated.length +
          deleteResults.deleted +
          mergeResults.merged,
      },
    };

    console.log("🎉 Intelligent sync completed:", finalResults.summary);
    return finalResults;
  } catch (error) {
    console.error("❌ Intelligent sync failed:", error);
    throw error;
  }
};
