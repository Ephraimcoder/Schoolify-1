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

      // Modified tasks (updated_at > last_synced_at)
      const lastModified = task._raw.updated_at || 0;
      const lastSynced = task.lastSyncedAt?.getTime() || 0;

      return lastModified > lastSynced;
    });

    return unsyncedTasks;
  } catch (error) {
    showError("Error getting unsynced tasks: " + error.message);
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
 * Fetch Appwrite-only tasks and merge them locally
 */
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
 * Full intelligent sync: Both directions with proper conflict resolution
 */
export const performIntelligentSync = async (userId) => {
  try {
    // Step 1: Get all Appwrite tasks for comparison
    const appwriteTasks =
      await appwriteSyncService.fetchTasksFromAppwrite(userId);

    // Step 2: Get all local tasks
    const tasksCollection = database.collections.get("tasks");
    const localTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    const results = {
      localToAppwrite: { created: [], updated: [], failed: [], skipped: 0 },
      appwriteToLocal: { updated: [], merged: [], failed: [], skipped: 0 },
      conflicts: [],
    };

    // Step 3: Compare and sync Appwrite → Local for existing tasks
    for (const appwriteTask of appwriteTasks) {
      const localTask = localTasks.find(
        (local) => local.appwriteId === appwriteTask.$id
      );

      if (localTask) {
        // Task exists in both places - check for conflicts
        const localLastSynced = localTask.lastSyncedAt?.getTime() || 0;
        // Use Appwrite's built-in $updatedAt field instead of last_synced_at
        const appwriteLastSynced = appwriteTask.$updatedAt
          ? new Date(appwriteTask.$updatedAt).getTime()
          : appwriteTask.last_synced_at || 0;

        if (appwriteLastSynced > localLastSynced) {
          // Appwrite is newer - update local
          try {
            await database.write(async () => {
              await localTask.update((task) => {
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
                task.lastSyncedAt = new Date();
              });
            });
            results.appwriteToLocal.updated.push(appwriteTask);
            results.conflicts.push({
              type: "appwrite_won",
              taskId: appwriteTask.$id,
              reason: "Appwrite task was newer",
            });
          } catch (error) {
            showError(`Failed to update local task: ${error.message}`);
            results.appwriteToLocal.failed.push({
              task: appwriteTask,
              error: error.message,
            });
          }
        } else if (localLastSynced > appwriteLastSynced) {
          // Local is newer - will be handled in next step
          results.conflicts.push({
            type: "local_pending",
            taskId: appwriteTask.$id,
            reason: "Local task is newer, will push to Appwrite",
          });
        }
      }
    }

    // Step 4: Sync unsynced local tasks to Appwrite
    const localSyncResults = await syncUnsyncedTasksToAppwrite(userId);
    results.localToAppwrite = localSyncResults;

    // Step 5: Merge Appwrite-only tasks to local
    const mergeResults = await mergeAppwriteOnlyTasks(userId);
    results.appwriteToLocal.merged = mergeResults.merged;

    const finalResults = {
      success: localSyncResults.success && mergeResults.success,
      ...results,
      summary: {
        totalCreated: localSyncResults.created.length,
        totalUpdated:
          localSyncResults.updated.length +
          results.appwriteToLocal.updated.length,
        totalFailed:
          localSyncResults.failed.length +
          results.appwriteToLocal.failed.length,
        totalMerged: mergeResults.merged,
        totalProcessed:
          localSyncResults.created.length +
          localSyncResults.updated.length +
          results.appwriteToLocal.updated.length +
          mergeResults.merged,
        conflictsResolved: results.conflicts.length,
      },
    };

    showSuccess("Intelligent sync completed successfully");
    return finalResults;
  } catch (error) {
    showError("Intelligent sync failed: " + error.message);
    throw error;
  }
};
