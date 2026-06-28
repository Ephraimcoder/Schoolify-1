import { Q } from "@nozbe/watermelondb";
import * as FileSystem from "expo-file-system";
import { database } from "../database/database";

const BACKUP_VERSION = 1;
const BACKUP_PREFIX = "scholar-flow-backup";

const formatBackupFileName = () => {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${BACKUP_PREFIX}-${stamp}.json`;
};

const serializeTaskForBackup = (task) => ({
  id: task.id,
  title: task.title || "",
  description: task.description || "",
  category: task.categoryName || "",
  priority: task.priorityName || "",
  dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  dueTime: task.dueTime ? task.dueTime.toISOString() : null,
  isCompleted: !!task.isCompleted,
  alertEnabled: !!task.alertEnabled,
  subTasks: task.subtasksJson ? JSON.parse(task.subtasksJson) : [],
  notificationId: task.notificationId || null,
  itemType: task.itemType || "task",
  color: task.color || null,
  userId: task.userId || null,
  createdAt: task.createdAt ? task.createdAt.toISOString() : null,
  updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
  appwriteId: task.appwriteId || null,
});

const buildTaskSignature = (task) => {
  const normalizedTitle = (task.title || "").trim().toLowerCase();
  const normalizedDescription = (task.description || "").trim().toLowerCase();
  const normalizedDueDate = task.dueDate || "";
  const normalizedDueTime = task.dueTime || "";
  const normalizedStatus = task.isCompleted ? "done" : "pending";

  return `${normalizedTitle}::${normalizedDescription}::${normalizedDueDate}::${normalizedDueTime}::${normalizedStatus}`;
};

const validateBackupPayload = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  if (!Array.isArray(payload.tasks)) return false;
  if (payload.version !== BACKUP_VERSION) return false;
  return payload.tasks.every((task) => task && typeof task === "object");
};

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

export const exportTasksToBackupFile = async (userId) => {
  try {
    const tasksCollection = database.collections.get("tasks");
    const tasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();

    const backupPayload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: "1.0.0",
      taskCount: tasks.length,
      tasks: tasks.map(serializeTaskForBackup),
    };

    const fileName = formatBackupFileName();
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupPayload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return {
      fileName,
      fileUri,
      taskCount: tasks.length,
    };
  } catch (error) {
    console.error("Error exporting backup file:", error);
    throw new Error("Failed to export backup file.");
  }
};

export const importTasksFromBackupFile = async (fileUri, userId) => {
  try {
    const rawContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const backupPayload = JSON.parse(rawContent);

    if (!validateBackupPayload(backupPayload)) {
      throw new Error("This backup file is not supported.");
    }

    const tasksCollection = database.collections.get("tasks");
    const existingTasks = await tasksCollection
      .query(Q.where("user_id", userId || ""))
      .fetch();
    const existingSignatures = new Set(
      existingTasks.map((task) => buildTaskSignature(task)),
    );

    let created = 0;
    let skipped = 0;

    await database.write(async () => {
      for (const backupTask of backupPayload.tasks) {
        const signature = buildTaskSignature(backupTask);
        if (existingSignatures.has(signature)) {
          skipped += 1;
          continue;
        }

        await tasksCollection.create((task) => {
          task.title = backupTask.title || "";
          task.description = backupTask.description || "";
          task.categoryName = backupTask.category || "";
          task.priorityName = backupTask.priority || "";
          task.dueDate = backupTask.dueDate ? new Date(backupTask.dueDate) : null;
          task.dueTime = backupTask.dueTime ? new Date(backupTask.dueTime) : null;
          task.isCompleted = !!backupTask.isCompleted;
          task.itemType = backupTask.itemType || "task";
          task.alertEnabled = !!backupTask.alertEnabled;
          task.notificationId = backupTask.notificationId || null;
          task.subtasksJson = JSON.stringify(backupTask.subTasks || []);
          task.userId = userId || backupTask.userId || "";
          task.color = backupTask.color || null;
          task.lastSyncedAt = null;
          task.appwriteId = backupTask.appwriteId || null;
        });

        existingSignatures.add(signature);
        created += 1;
      }
    });

    return {
      created,
      skipped,
      total: backupPayload.tasks.length,
    };
  } catch (error) {
    console.error("Error importing backup file:", error);
    throw new Error(
      error?.message || "Failed to import backup file. Please try again.",
    );
  }
};
