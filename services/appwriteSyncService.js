import NetInfo from "@react-native-community/netinfo";
import { Client, Databases, ID, Query } from "react-native-appwrite";

// Appwrite configuration
const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  platform: "com.jms.schoolify",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  tasksCollectionId: process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID,
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

const databases = new Databases(client);

/**
 * Manual Appwrite Sync Service for Tasks
 * All operations are manual - no automatic syncing
 */
class AppwriteSyncService {
  /**
   * Check network connectivity
   */
  async checkConnectivity() {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    return true;
  }

  /**
   * Convert WatermelonDB task to Appwrite format
   */
  convertToAppwriteFormat(task, userId) {
    return {
      user_id: userId,
      title: task.title || "",
      description: task.description || "",
      is_completed: task.isCompleted || false,
      categoryName: task.categoryName || task.category || "",
      priorityName: task.priorityName || task.priority || "",
      itemType: task.itemType || "task",
      alert_enabled: task.alertEnabled || false,
      subtasks_json: task.subTasks
        ? JSON.stringify(task.subTasks)
        : task.subtasksJson || "[]",
      due_date: task.dueDate ? new Date(task.dueDate).getTime() : 0,
      due_time: task.dueTime ? new Date(task.dueTime).getTime() : 0,
      last_synced_at: Date.now(),
    };
  }

  /**
   * Convert Appwrite task to WatermelonDB format
   */
  convertFromAppwriteFormat(doc) {
    return {
      $id: doc.$id,
      user_id: doc.user_id,
      title: doc.title,
      description: doc.description,
      is_completed: doc.is_completed,
      categoryName: doc.categoryName,
      priorityName: doc.priorityName,
      itemType: doc.itemType,
      alert_enabled: doc.alert_enabled,
      subtasks_json: doc.subtasks_json,
      last_synced_at: doc.last_synced_at,
      due_date: doc.due_date,
      due_time: doc.due_time,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  }

  /**
   * Manual: Fetch all tasks from Appwrite for a user
   */
  async fetchTasksFromAppwrite(userId) {
    await this.checkConnectivity();

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        [Query.equal("user_id", userId)]
      );

      return response.documents.map((doc) =>
        this.convertFromAppwriteFormat(doc)
      );
    } catch (error) {
      console.error("Appwrite fetch error:", error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  /**
   * Manual: Create a new task in Appwrite
   */
  async createTaskInAppwrite(taskData, userId) {
    await this.checkConnectivity();

    try {
      const appwriteTask = this.convertToAppwriteFormat(taskData, userId);

      const newTask = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        ID.unique(),
        appwriteTask
      );

      return this.convertFromAppwriteFormat(newTask);
    } catch (error) {
      console.error("Appwrite create error:", error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Manual: Update an existing task in Appwrite
   */
  async updateTaskInAppwrite(taskId, updatedFields) {
    await this.checkConnectivity();

    try {
      const updateData = {
        ...updatedFields,
        last_synced_at: Date.now(),
      };

      // Convert date fields to timestamps if present
      if (updateData.dueDate) {
        updateData.due_date = new Date(updateData.dueDate).getTime();
        delete updateData.dueDate;
      }
      if (updateData.dueTime) {
        updateData.due_time = new Date(updateData.dueTime).getTime();
        delete updateData.dueTime;
      }

      // Convert boolean fields
      if (updateData.isCompleted !== undefined) {
        updateData.is_completed = updateData.isCompleted;
        delete updateData.isCompleted;
      }
      if (updateData.alertEnabled !== undefined) {
        updateData.alert_enabled = updateData.alertEnabled;
        delete updateData.alertEnabled;
      }

      // Handle category/priority naming - support both conventions
      if (updateData.category !== undefined) {
        updateData.categoryName = updateData.category;
        delete updateData.category;
      }
      if (updateData.priority !== undefined) {
        updateData.priorityName = updateData.priority;
        delete updateData.priority;
      }

      // Convert subtasks to JSON
      if (updateData.subTasks !== undefined) {
        updateData.subtasks_json = JSON.stringify(updateData.subTasks);
        delete updateData.subTasks;
      } else if (updateData.subtasksJson !== undefined) {
        // Handle if subtasksJson is passed directly
        updateData.subtasks_json = updateData.subtasksJson;
        delete updateData.subtasksJson;
      }

      const updatedTask = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        taskId,
        updateData
      );

      return this.convertFromAppwriteFormat(updatedTask);
    } catch (error) {
      console.error("Appwrite update error:", error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  /**
   * Manual: Delete a task from Appwrite
   */
  async deleteTaskFromAppwrite(taskId) {
    await this.checkConnectivity();

    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        taskId
      );

      return { success: true };
    } catch (error) {
      console.error("Appwrite delete error:", error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  /**
   * Manual: Sync all local tasks to Appwrite with conflict resolution
   * - Compares local vs Appwrite tasks
   * - Updates newer versions based on last_synced_at
   * - Creates new local tasks in Appwrite
   * - Creates new Appwrite tasks locally
   * - Uses "last write wins" principle
   */
  async syncAllTasksToAppwrite(localTasks, userId) {
    await this.checkConnectivity();

    const results = {
      created: [],
      updated: [],
      failed: [],
      conflicts: [],
    };

    try {
      // Get all Appwrite tasks
      const appwriteTasks = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        [Query.equal("user_id", userId)]
      );

      // Create maps for easy lookup
      const localTasksMap = new Map();
      const appwriteTasksMap = new Map();

      // Index local tasks by their Appwrite ID (if they have one)
      localTasks.forEach((task) => {
        if (task.$id) {
          localTasksMap.set(task.$id, task);
        }
      });

      // Index Appwrite tasks by their ID
      appwriteTasks.documents.forEach((task) => {
        appwriteTasksMap.set(task.$id, task);
      });

      const now = Date.now();

      // Process each local task
      for (const localTask of localTasks) {
        try {
          if (localTask.$id) {
            // Task exists in both - check for conflicts
            const appwriteTask = appwriteTasksMap.get(localTask.$id);

            if (appwriteTask) {
              const localLastSynced = localTask.last_synced_at || 0;
              const appwriteLastSynced = appwriteTask.last_synced_at || 0;

              if (localLastSynced > appwriteLastSynced) {
                // Local is newer - update Appwrite
                const updatedTask = await this.updateTaskInAppwrite(
                  localTask.$id,
                  {
                    title: localTask.title,
                    description: localTask.description,
                    is_completed: localTask.isCompleted,
                    categoryName: localTask.category,
                    priorityName: localTask.priority,
                    due_date: localTask.dueDate,
                    due_time: localTask.dueTime,
                    alert_enabled: localTask.alertEnabled,
                    subtasks_json: localTask.subTasks
                      ? JSON.stringify(localTask.subTasks)
                      : "[]",
                    itemType: localTask.itemType,
                  }
                );
                results.updated.push(updatedTask);
                results.conflicts.push({
                  type: "local_won",
                  taskId: localTask.$id,
                  reason: "Local task was newer",
                });
              } else if (appwriteLastSynced > localLastSynced) {
                // Appwrite is newer - update local (this would be handled by the caller)
                results.conflicts.push({
                  type: "appwrite_won",
                  taskId: localTask.$id,
                  reason: "Appwrite task was newer",
                });
              } else {
                // Same timestamp - no conflict
                console.log(`No conflict for task ${localTask.$id}`);
              }
            }
          } else {
            // Local task doesn't have Appwrite ID - create it in Appwrite
            const createdTask = await this.createTaskInAppwrite(
              localTask,
              userId
            );
            results.created.push(createdTask);
          }
        } catch (error) {
          results.failed.push({ task: localTask, error: error.message });
        }
      }

      // Find Appwrite-only tasks (not in local)
      for (const appwriteTask of appwriteTasks.documents) {
        if (
          !localTasks.some((localTask) => localTask.$id === appwriteTask.$id)
        ) {
          try {
            // This task exists only in Appwrite - add to local
            const localFormat = this.convertFromAppwriteFormat(appwriteTask);
            results.conflicts.push({
              type: "appwrite_only",
              taskId: appwriteTask.$id,
              task: localFormat,
              reason: "Task exists only in Appwrite",
            });
          } catch (error) {
            results.failed.push({ task: appwriteTask, error: error.message });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Appwrite sync all error:", error);
      throw new Error(`Failed to sync tasks: ${error.message}`);
    }
  }
}

// Export singleton instance
export const appwriteSyncService = new AppwriteSyncService();
export default appwriteSyncService;
