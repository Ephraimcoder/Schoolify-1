import { Q } from "@nozbe/watermelondb";
import { database } from "../database/database";
import { appwriteSyncService } from "../services/appwriteSyncService";
import { showError } from "../utils/toast";

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

      // 🚀 Handle null lastSyncedAt (newly created/modified tasks)
      // If lastSyncedAt is null, it definitely needs syncing
      if (task.lastSyncedAt === null) {
        return true;
      }

      return lastModified > lastSynced;
    });

    console.log(
      `Found ${unsyncedTasks.length} tasks that need syncing out of ${allTasks.length} total`
    );

    // 🚀 Debug: Log details of tasks needing sync
    unsyncedTasks.forEach((task, index) => {
      console.log(`Task ${index + 1}: "${task.title}"`, {
        appwriteId: task.appwriteId,
        lastModified: task._raw.last_modified,
        lastSyncedAt: task.lastSyncedAt,
        needsSync: true,
      });
    });

    return unsyncedTasks;
  } catch (error) {
    console.error("Error getting unsynced tasks:", error);
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
      console.log("No tasks need syncing");
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

            results.updated.push({
              localId: task.id,
              appwriteId: updatedTask.$id,
              title: task.title,
            });
            console.log(`✅ Updated task: ${task.title}`);
          } catch (updateError) {
            console.error(
              `❌ Failed to update task "${task.title}":`,
              updateError
            );
            results.failed.push({
              task: task,
              error: updateError.message,
            });
          }
        } else {
          // Create new task in Appwrite
          try {
            const newTask = await appwriteSyncService.createTaskInAppwrite(
              {
                title: task.title,
                description: task.description,
                is_completed: task.isCompleted,
                categoryName: task.categoryName,
                priorityName: task.priorityName,
                due_date: task.dueDate ? task.dueDate.getTime() : null,
                due_time: task.dueTime ? task.dueTime.getTime() : null,
                alert_enabled: task.alertEnabled,
                subtasks_json: task.subtasksJson || "[]",
                itemType: task.itemType,
                last_synced_at: Date.now(),
              },
              userId
            );

            // Update local task with Appwrite ID
            await updateLocalTaskAppwriteId(task.id, newTask.$id);

            results.created.push({
              localId: task.id,
              appwriteId: newTask.$id,
              title: task.title,
            });
            console.log(`✅ Created task: ${task.title}`);
          } catch (createError) {
            console.error(
              `❌ Failed to create task "${task.title}":`,
              createError
            );
            results.failed.push({
              task: task,
              error: createError.message,
            });
          }
        }
      } catch (error) {
        showError(`Failed to sync task "${task.title}": ${error.message}`);
        results.failed.push({
          task: task,
          error: error.message,
        });
      }
    }

    console.log(
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
