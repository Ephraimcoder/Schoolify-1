import { Q } from "@nozbe/watermelondb";
import { database } from "../database/database";
import { appwriteSyncService } from "../services/appwriteSyncService";
import { showError } from "../utils/toast";

// Simple UUID generator for local backup deduplication
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Merge Appwrite-only tasks to local database
 * - Finds tasks that exist in Appwrite but not locally
 * - Creates them in local WatermelonDB
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
        (localTask) => localTask.appwriteId === appwriteTask.$id,
      );
    });

    if (appwriteOnlyTasks.length === 0) {
      // No cloud tasks to merge
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

          // 🆕 Generate UUID for local backup deduplication
          task.localUuid = generateUUID();
        });
      }
    });

    return { success: true, merged: appwriteOnlyTasks.length };
  } catch (error) {
    showError("Failed to merge cloud tasks: " + error.message);
    throw error;
  }
};
