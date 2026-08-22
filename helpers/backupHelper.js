import { Q } from "@nozbe/watermelondb";
import { database } from "../database/database";

const BACKUP_VERSION = 1;
const BACKUP_PREFIX = "scholar-flow-backup";

const getFileSystem = () => {
  try {
    return require("expo-file-system");
  } catch (error) {
    throw new Error(
      "Local backup requires a rebuilt native app. Please rebuild the dev client and try again.",
    );
  }
};

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
  itemType: task.itemType || "task",
  color: task.color || null,
  userId: task.userId || null,
  createdAt: task.createdAt ? task.createdAt.toISOString() : null,
  updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
});

const normalizeSignatureValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value.trim().toLowerCase();
  return String(value);
};

const normalizeSubtasks = (task) => {
  const rawSubtasks = Array.isArray(task?.subTasks)
    ? task.subTasks
    : Array.isArray(task?.subtasks)
      ? task.subtasks
      : task?.subtasksJson
        ? (() => {
            try {
              return JSON.parse(task.subtasksJson);
            } catch (error) {
              return [];
            }
          })()
        : [];

  return (rawSubtasks || [])
    .map((subtask) => ({
      title: normalizeSignatureValue(subtask?.title),
      isCompleted: !!subtask?.isCompleted,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
};

const buildComparableTaskPayload = (task) => ({
  title: normalizeSignatureValue(task.title),
  description: normalizeSignatureValue(task.description),
  category: normalizeSignatureValue(task.category || task.categoryName),
  priority: normalizeSignatureValue(task.priority || task.priorityName),
  dueDate: normalizeSignatureValue(task.dueDate),
  dueTime: normalizeSignatureValue(task.dueTime),
  itemType: task.itemType || "task",
  // Exclude mutable fields from deduplication:
  // - isCompleted (changes when tasks are completed)
  // - alertEnabled (notification settings change)
  // - color (color settings change)
  // - subTasks (subtask completion changes)
});

const buildTaskSignature = (task) => {
  return JSON.stringify(buildComparableTaskPayload(task));
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
    showError("Backup settings unavailable. Using default backup enabled.");
    return true; // Default to enabled on error
  }
};

const getBackupDirectory = async (FileSystem) => {
  const candidates = [
    FileSystem.downloadDirectory,
    FileSystem.storageDirectory,
    FileSystem.externalDirectory,
    FileSystem.documentDirectory,
    FileSystem.cacheDirectory,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) {
      return candidate.endsWith("/") ? candidate : `${candidate}/`;
    }
  }

  return FileSystem.documentDirectory || FileSystem.cacheDirectory || "/";
};

const writeBackupFile = async (FileSystem, fileName, contents) => {
  if (
    typeof FileSystem.StorageAccessFramework
      ?.requestDirectoryPermissionsAsync === "function"
  ) {
    try {
      const directoryPermissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (directoryPermissions?.granted) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryPermissions.directoryUri,
          fileName,
          "application/json",
        );

        await FileSystem.writeAsStringAsync(fileUri, contents, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        return fileUri;
      }
    } catch (error) {
      // Check if this is a MissingActivity error - occurs when activity is no longer available
      if (
        error?.message?.includes("activity") ||
        error?.message?.includes("Activity")
      ) {
        console.warn(
          "Activity no longer available, falling back to standard export",
        );
      } else {
        console.warn(
          "Storage Access Framework backup export failed, falling back to standard export:",
          error.message,
        );
      }
    }
  }

  const directoryUri = await getBackupDirectory(FileSystem);
  await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  const fallbackFileUri = `${directoryUri}${fileName}`;

  await FileSystem.writeAsStringAsync(fallbackFileUri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fallbackFileUri;
};

export const exportTasksToBackupFile = async (userId) => {
  try {
    const FileSystem = getFileSystem();
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
    const backupContent = JSON.stringify(backupPayload, null, 2);
    const fileUri = await writeBackupFile(FileSystem, fileName, backupContent);

    return {
      fileName,
      fileUri,
      taskCount: tasks.length,
    };
  } catch (error) {
    throw new Error("Failed to export backup file.");
  }
};

export const importTasksFromBackupFile = async (fileUri, userId) => {
  try {
    const FileSystem = getFileSystem();
    const rawContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const backupPayload = JSON.parse(rawContent);

    if (!validateBackupPayload(backupPayload)) {
      throw new Error("This backup file is not supported.");
    }

    if (!userId) {
      throw new Error("Import requires an authenticated user.");
    }

    const invalidUserTask = backupPayload.tasks.find(
      (task) => task.userId !== userId,
    );

    if (invalidUserTask) {
      throw new Error(
        "This backup belongs to a different user and cannot be imported.",
      );
    }

    const tasksCollection = database.collections.get("tasks");
    const existingTasks = await tasksCollection
      .query(Q.where("user_id", userId))
      .fetch();
    const existingSignatures = new Set(
      existingTasks.map((task) => buildTaskSignature(task)),
    );

    let created = 0;
    let skipped = 0;

    await database.write(async () => {
      for (const backupTask of backupPayload.tasks) {
        // Normalize backup task dates for signature comparison
        const normalizedBackupTask = {
          ...backupTask,
          dueDate: backupTask.dueDate ? new Date(backupTask.dueDate) : null,
          dueTime: backupTask.dueTime ? new Date(backupTask.dueTime) : null,
        };
        const signature = buildTaskSignature(normalizedBackupTask);
        if (existingSignatures.has(signature)) {
          // Keep the existing local task and skip creating a duplicate.
          skipped += 1;
          continue;
        }

        await tasksCollection.create((task) => {
          task.title = normalizedBackupTask.title || "";
          task.description = normalizedBackupTask.description || "";
          task.categoryName = normalizedBackupTask.category || "";
          task.priorityName = normalizedBackupTask.priority || "";
          task.dueDate = normalizedBackupTask.dueDate || null;
          task.dueTime = normalizedBackupTask.dueTime || null;
          task.isCompleted = !!normalizedBackupTask.isCompleted;
          task.itemType = normalizedBackupTask.itemType || "task";
          task.alertEnabled = !!normalizedBackupTask.alertEnabled;
          task.notificationId = normalizedBackupTask.notificationId || null;
          task.subtasksJson = JSON.stringify(
            normalizedBackupTask.subTasks || [],
          );
          task.userId = userId || normalizedBackupTask.userId || "";
          task.color = normalizedBackupTask.color || null;
          task.lastSyncedAt = null;
          task.appwriteId = normalizedBackupTask.appwriteId || null;
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
    throw new Error(
      error?.message || "Failed to import backup file. Please try again.",
    );
  }
};
