import { Q } from "@nozbe/watermelondb";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { database } from "../database/database";
import {
  performIntelligentSync,
  syncDeletedTasksToAppwrite,
  syncUnsyncedTasksToAppwrite,
} from "../helpers/syncHelper";
import { showError, showInfo } from "../utils/toast";
import { useUser } from "./UserContext";

// Create the context
export const TasksContext = createContext();

// Default data
const DEFAULT_CATEGORIES = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "English" },
  { id: "3", name: "Physics" },
  { id: "4", name: "Chemistry" },
  { id: "5", name: "Biology" },
  { id: "6", name: "Computer Science" },
  { id: "7", name: "Class" },
];

const DEFAULT_PRIORITIES = [
  { name: "Low", level: 1 },
  { name: "Medium", level: 2 },
  { name: "High", level: 3 },
];

// Helper: map WM Task model -> UI shape consumed by components
const mapTaskModelToUi = (m) => ({
  id: m.id,
  title: m.title || "",
  description: m.description || "",
  category: m.categoryName || "",
  priority: m.priorityName || "",
  dueDate: m.dueDate ? m.dueDate.toISOString() : null,
  dueTime: m.dueTime ? m.dueTime.toISOString() : null,
  isCompleted: !!m.isCompleted,
  alertEnabled: !!m.alertEnabled,
  subTasks: m.subtasksJson ? JSON.parse(m.subtasksJson) : [],
  notificationId: m.notificationId || null,
  date: m.createdAt ? m.createdAt.toISOString() : null,
  updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
  color: m.color || undefined,
});

export const TaskProvider = ({ children }) => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    dueDate: new Date().toISOString(),
    dueTime: new Date().toISOString(),
    isCompleted: false,
    alertEnabled: false,
  });

  const refreshTasks = useCallback(async () => {
    try {
      const taskCol = database.collections.get("tasks");
      const models = await taskCol
        .query(Q.where("user_id", user?.accountId || ""))
        .fetch();
      setTasks(models.map(mapTaskModelToUi));
    } catch (error) {
      showError("Failed to refresh tasks. Please pull to refresh.");
    }
  }, [user?.accountId]);

  // Load initial data from WatermelonDB
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load tasks first (critical path)
      const tasksCollection = database.collections.get("tasks");
      const loadedTasks = await tasksCollection
        .query(Q.where("user_id", user?.accountId || ""))
        .fetch();
      setTasks(loadedTasks.map(mapTaskModelToUi));

      // Load categories and priorities in background for better UX
      setTimeout(async () => {
        try {
          // Load categories for current user (or global ones without user_id)
          const categoriesCollection = database.collections.get("categories");
          let loadedCategories = await categoriesCollection
            .query(
              Q.or(
                Q.where("user_id", user?.accountId || ""),
                Q.where("user_id", null),
              ),
            )
            .fetch();

          // If no categories exist, create default ones
          if (loadedCategories.length === 0) {
            await database.write(async () => {
              for (const category of DEFAULT_CATEGORIES) {
                await categoriesCollection.create((cat) => {
                  cat.name = category.name;
                  cat.userId = user?.accountId || null;
                });
              }
            });
            loadedCategories = await categoriesCollection.query().fetch();
          }
          setCategories(loadedCategories);

          // Load priorities for current user (or global ones without user_id)
          const prioritiesCollection = database.collections.get("priorities");
          let loadedPriorities = await prioritiesCollection
            .query(
              Q.or(
                Q.where("user_id", user?.accountId || ""),
                Q.where("user_id", null),
              ),
            )
            .fetch();

          // If no priorities exist, create default ones
          if (loadedPriorities.length === 0) {
            await database.write(async () => {
              for (const priority of DEFAULT_PRIORITIES) {
                await prioritiesCollection.create((prio) => {
                  prio.name = priority.name;
                  prio.level = priority.level;
                });
              }
            });
            loadedPriorities = await prioritiesCollection.query().fetch();
          }
          setPriorities(loadedPriorities);
        } catch (error) {
          console.error("Background data loading failed:", error);
        }
      }, 100); // Small delay to not block initial render
    } catch (error) {
      showError("Failed to load data. Please restart the app.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.accountId]);

  // Load data on component mount and user change
  useEffect(() => {
    if (user?.accountId) {
      loadInitialData();
    } else {
      // No user, so not loading
      setIsLoading(false);
    }
  }, [loadInitialData, user?.accountId]);

  // Add a new task
  const addTask = useCallback(
    async (taskData) => {
      try {
        const tasksCollection = database.collections.get("tasks");

        await database.write(async () => {
          await tasksCollection.create((task) => {
            task.title = taskData.title;
            task.description = taskData.description || "";
            // If you pass category/priorities as names from UI, save denormalized labels
            if (taskData.category) task.categoryName = taskData.category;
            if (taskData.priority) task.priorityName = taskData.priority;
            // Optional relational ids if you have them
            if (taskData.categoryId)
              task.category._raw.category_id = taskData.categoryId; // safe only if using relations explicitly
            if (taskData.priorityId)
              task.priority._raw.priority_id = taskData.priorityId;
            task.dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;
            task.dueTime = taskData.dueTime ? new Date(taskData.dueTime) : null;
            task.isCompleted = !!taskData.isCompleted;
            task.itemType = taskData.itemType || "task";
            if (taskData.alertEnabled !== undefined)
              task.alertEnabled = !!taskData.alertEnabled;
            if (taskData.notificationId)
              task.notificationId = String(taskData.notificationId);
            if (taskData.subTasks)
              task.subtasksJson = JSON.stringify(taskData.subTasks);
            task.userId = user?.accountId || "";

            // 🚀 Ensure new tasks have no lastSyncedAt so they're detected as needing sync
            task.lastSyncedAt = null;
          });
        });

        await refreshTasks();
        return { success: true };
      } catch (error) {
        showError("Failed to add task. Please try again.");
        throw error;
      }
    },
    [refreshTasks, user?.accountId],
  );

  // Update an existing task
  const updateTask = useCallback(
    async (taskId, updates) => {
      try {
        const tasksCollection = database.collections.get("tasks");
        const taskToUpdate = await tasksCollection.find(taskId);

        await database.write(async () => {
          await taskToUpdate.update((task) => {
            if (updates.title !== undefined) task.title = updates.title;
            if (updates.description !== undefined)
              task.description = updates.description;
            if (updates.category !== undefined)
              task.categoryName = updates.category;
            if (updates.priority !== undefined)
              task.priorityName = updates.priority;
            if (updates.dueDate !== undefined)
              task.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
            if (updates.dueTime !== undefined)
              task.dueTime = updates.dueTime ? new Date(updates.dueTime) : null;
            if (updates.isCompleted !== undefined)
              task.isCompleted = !!updates.isCompleted;
            if (updates.alertEnabled !== undefined)
              task.alertEnabled = !!updates.alertEnabled;
            if (updates.notificationId !== undefined)
              task.notificationId = String(updates.notificationId);
            if (updates.subTasks)
              task.subtasksJson = JSON.stringify(updates.subTasks);
            if (updates.itemType !== undefined)
              task.itemType = updates.itemType;

            // 🚀 Force sync detection by clearing lastSyncedAt
            // This ensures the task will be detected as needing sync
            task.lastSyncedAt = null;
          });
        });

        await refreshTasks();
        return { success: true };
      } catch (error) {
        showError("Failed to update task. Please try again.");
        throw error;
      }
    },
    [refreshTasks],
  );

  // Delete a task
  const deleteTask = useCallback(
    async (taskId) => {
      try {
        const tasksCollection = database.collections.get("tasks");
        const taskToDelete = await tasksCollection.find(taskId);

        await database.write(async () => {
          await taskToDelete.markAsDeleted();
        });

        await refreshTasks();
        return { success: true };
      } catch (error) {
        showError("Failed to delete task. Please try again.");
        throw error;
      }
    },
    [refreshTasks],
  );

  const getTaskById = useCallback(
    (id) => {
      return tasks.find((task) => task.id === id);
    },
    [tasks],
  );

  const handleAddTask = useCallback(
    async (data) => {
      const payload = data || { ...formData, subTasks };
      if (!payload.title || !payload.title.trim()) return;
      try {
        await database.write(async () => {
          const col = database.get("tasks");
          await col.create((rec) => {
            rec.title = payload.title || "";
            if (payload.description) rec.description = payload.description;
            rec.isCompleted = !!payload.isCompleted;
            rec.itemType = payload.category === "Class" ? "class" : "task";
            if (payload.category) rec.categoryName = payload.category;
            if (payload.priority) rec.priorityName = payload.priority;
            if (payload.dueDate) rec.dueDate = new Date(payload.dueDate);
            if (payload.dueTime) rec.dueTime = new Date(payload.dueTime);
            rec.alertEnabled = !!payload.alertEnabled;
            if (payload.notificationId)
              rec.notificationId = String(payload.notificationId);
            if (payload.subTasks)
              rec.subtasksJson = JSON.stringify(payload.subTasks);
            rec.userId = user?.accountId || "";

            // 🚀 Ensure new tasks have no lastSyncedAt so they're detected as needing sync
            rec.lastSyncedAt = null;
          });
        });
        await refreshTasks();
        resetForm();
      } catch (e) {
        showError("Failed to add task. Please try again.");
      }
    },
    [formData, subTasks, resetForm, refreshTasks, user?.accountId],
  );

  const addSubTask = useCallback((title) => {
    const newSubTask = {
      id: Date.now().toString(),
      title,
      isCompleted: false,
    };
    setSubTasks((prev) => [...prev, newSubTask]);
  }, []);

  const deleteSubTask = useCallback((id) => {
    setSubTasks((prev) => prev.filter((subtask) => subtask.id !== id));
  }, []);

  const clearSubTasks = useCallback(() => {
    setSubTasks([]);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      category: "",
      priority: "",
      dueDate: new Date().toISOString(),
      dueTime: new Date().toISOString(),
      isCompleted: false,
      alertEnabled: false,
    });
  }, []);

  // Derive additional categories from tasks (for synced data that may not exist in local categories table)
  const derivedCategories = useMemo(() => {
    const names = new Set();

    tasks.forEach((t) => {
      if (!t?.category) return;

      // Skip if it's already part of default list
      const isDefault = DEFAULT_CATEGORIES.some(
        (cat) => cat.name.toLowerCase() === String(t.category).toLowerCase(),
      );
      if (isDefault) return;

      names.add(String(t.category));
    });

    return Array.from(names).map((name) => ({
      id: `derived-${name}`,
      name,
    }));
  }, [tasks]);

  // Derive additional priorities from tasks
  const derivedPriorities = useMemo(() => {
    const names = new Set();

    tasks.forEach((t) => {
      if (!t?.priority) return;

      const isDefault = DEFAULT_PRIORITIES.some(
        (prio) => prio.name.toLowerCase() === String(t.priority).toLowerCase(),
      );
      if (isDefault) return;

      names.add(String(t.priority));
    });

    return Array.from(names).map((name) => ({
      id: `derived-${name}`,
      name,
    }));
  }, [tasks]);

  // Merge locally stored and derived categories/priorities, avoiding duplicates by name
  const mergedCategories = useMemo(() => {
    if (!categories?.length && !derivedCategories.length) return [];

    const existingNames = new Set(
      (categories || []).map((c) => String(c.name).toLowerCase()),
    );

    const extra = derivedCategories.filter((dc) => {
      const name = String(dc.name).toLowerCase();
      if (existingNames.has(name)) return false;
      existingNames.add(name);
      return true;
    });

    return [...(categories || []), ...extra];
  }, [categories, derivedCategories]);

  const mergedPriorities = useMemo(() => {
    if (!priorities?.length && !derivedPriorities.length) return [];

    const existingNames = new Set(
      (priorities || []).map((p) => String(p.name).toLowerCase()),
    );

    const extra = derivedPriorities.filter((dp) => {
      const name = String(dp.name).toLowerCase();
      if (existingNames.has(name)) return false;
      existingNames.add(name);
      return true;
    });

    return [...(priorities || []), ...extra];
  }, [priorities, derivedPriorities]);

  const addCategory = useCallback(
    async (categoryName) => {
      try {
        const col = database.get("categories");
        let created;
        await database.write(async () => {
          created = await col.create((rec) => {
            rec.name = categoryName;
            rec.userId = user?.accountId || "";
          });
        });

        // Refresh categories state to include new category (scoped to user)
        const updatedCategories = await col
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setCategories(updatedCategories);

        return { id: created.id, name: categoryName };
      } catch (e) {
        showError("Failed to add category. Please try again.");
        return null;
      }
    },
    [user?.accountId],
  );

  // Remove derived category by clearing it from all tasks
  const removeDerivedCategory = useCallback(
    async (name) => {
      try {
        const tasksToUpdate = tasks.filter((task) => task.category === name);
        await Promise.all(
          tasksToUpdate.map((task) => updateTask(task.id, { category: "" })),
        );
        await refreshTasks();

        // Force refresh categories state to recalculate derived ones
        const categoriesCollection = database.collections.get("categories");
        const updatedCategories = await categoriesCollection
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setCategories(updatedCategories);

        showInfo(`Removed category "${name}" from all tasks`);
      } catch (e) {
        showError("Failed to remove derived category");
      }
    },
    [tasks, updateTask, refreshTasks, user?.accountId],
  );

  // Remove derived priority by clearing it from all tasks
  const removeDerivedPriority = useCallback(
    async (name) => {
      try {
        const tasksToUpdate = tasks.filter((task) => task.priority === name);
        await Promise.all(
          tasksToUpdate.map((task) => updateTask(task.id, { priority: "" })),
        );
        await refreshTasks();

        // Force refresh priorities state to recalculate derived ones
        const prioritiesCollection = database.collections.get("priorities");
        const updatedPriorities = await prioritiesCollection
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setPriorities(updatedPriorities);

        showInfo(`Removed priority "${name}" from all tasks`);
      } catch (e) {
        showError("Failed to remove derived priority");
      }
    },
    [tasks, updateTask, refreshTasks, user?.accountId],
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id) => {
      try {
        if (String(id).startsWith("derived-")) {
          const name = id.replace("derived-", "");
          await removeDerivedCategory(name);
          return;
        }
        const categoriesCollection = database.collections.get("categories");
        await database.write(async () => {
          const model = await categoriesCollection.find(id).catch(() => null);
          if (!model) {
            console.warn("Category not found when deleting", id);
            return;
          }
          await model.markAsDeleted();
        });

        // Refresh categories state to remove deleted category (scoped to user)
        const updatedCategories = await categoriesCollection
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setCategories(updatedCategories);
      } catch (e) {
        console.error("Error deleting category", e);
        showError("Failed to delete category. Please try again.");
      }
    },
    [user?.accountId],
  );

  // Add new priority
  const addPriority = useCallback(
    async (priorityName) => {
      try {
        const col = database.get("priorities");
        let created;
        await database.write(async () => {
          created = await col.create((rec) => {
            rec.name = priorityName;
            rec.level =
              priorityName.toLowerCase() === "high"
                ? 3
                : priorityName.toLowerCase() === "medium"
                  ? 2
                  : 1;
            rec.userId = user?.accountId || "";
          });
        });

        // Refresh priorities state to include new priority (scoped to user)
        const updatedPriorities = await col
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setPriorities(updatedPriorities);

        return { id: created.id, name: priorityName };
      } catch (e) {
        showError("Failed to add priority. Please try again.");
        return null;
      }
    },
    [user?.accountId],
  );

  // Delete priority
  const deletePriority = useCallback(
    async (id) => {
      try {
        if (String(id).startsWith("derived-")) {
          const name = id.replace("derived-", "");
          await removeDerivedPriority(name);
          return;
        }
        const prioritiesCollection = database.collections.get("priorities");
        await database.write(async () => {
          const model = await prioritiesCollection.find(id).catch(() => null);
          if (!model) {
            console.warn("Priority not found when deleting", id);
            return;
          }
          await model.markAsDeleted();
        });

        // Refresh priorities state to remove deleted priority (scoped to user)
        const updatedPriorities = await prioritiesCollection
          .query(
            Q.or(
              Q.where("user_id", user?.accountId || ""),
              Q.where("user_id", null),
            ),
          )
          .fetch();
        setPriorities(updatedPriorities);
      } catch (e) {
        console.error("Error deleting priority", e);
        showError("Failed to delete priority. Please try again.");
      }
    },
    [user?.accountId],
  );

  // Manual Appwrite Sync Functions using helper

  /**
   * Intelligent sync: Only sync unsynced/changed tasks
   */
  const syncUnsyncedTasks = useCallback(async () => {
    if (!user?.accountId) {
      throw new Error("User not authenticated");
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const results = await syncUnsyncedTasksToAppwrite(user.accountId);

      // Refresh local tasks after sync
      await refreshTasks();

      return results;
    } catch (error) {
      if (error.code !== "BACKUP_DISABLED") {
        setSyncError(error.message);
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.accountId, refreshTasks]);

  /**
   * Merge Appwrite-only tasks to local
   */
  const mergeAppwriteTasks = useCallback(async () => {
    if (!user?.accountId) {
      throw new Error("User not authenticated");
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const results = await mergeAppwriteOnlyTasks(user.accountId);

      // Refresh local tasks after merge
      await refreshTasks();

      return results;
    } catch (error) {
      if (error.code !== "BACKUP_DISABLED") {
        setSyncError(error.message);
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.accountId, refreshTasks]);

  /**
   * Sync deletions from local to Appwrite with progress indication
   */
  const syncDeletedTasks = useCallback(async () => {
    if (!user?.accountId) {
      throw new Error("User not authenticated");
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      showInfo("Syncing deletions...", 2000);
      const results = await syncDeletedTasksToAppwrite(user.accountId);

      // Refresh local tasks after deletion sync
      await refreshTasks();

      // User-friendly completion message
      if (results.deleted > 0) {
        // Deleted ${results.deleted} tasks from cloud
      } else if (results.failed > 0) {
        // Failed to delete ${results.failed} tasks
      } else {
        // No deletions needed
      }

      return results;
    } catch (error) {
      if (error.code !== "BACKUP_DISABLED") {
        setSyncError(error.message);
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.accountId, refreshTasks]);

  /**
   * Full intelligent sync: Both directions with progress reporting
   */
  const syncAllTasksIntelligently = useCallback(
    async (onProgress) => {
      if (!user?.accountId) {
        throw new Error("User not authenticated");
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const results = await performIntelligentSync(
          user.accountId,
          onProgress,
        );

        // Refresh local tasks after full sync
        await refreshTasks();

        return results;
      } catch (error) {
        if (error.code !== "BACKUP_DISABLED") {
          setSyncError(error.message);
        }
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.accountId, refreshTasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      categories: mergedCategories,
      priorities: mergedPriorities,
      isLoading,
      isSyncing,
      syncError,
      subTasks,
      formData,
      setFormData,
      handleAddTask,
      resetForm,
      addTask,
      updateTask,
      deleteTask,
      addSubTask,
      deleteSubTask,
      clearSubTasks,
      setSubTasks,
      getTaskById,
      refreshTasks,
      addCategory,
      deleteCategory,
      addPriority,
      deletePriority,
      // Intelligent sync functions
      syncUnsyncedTasks,
      mergeAppwriteTasks,
      syncDeletedTasks,
      syncAllTasksIntelligently,
    }),
    [
      tasks,
      mergedCategories,
      mergedPriorities,
      isLoading,
      isSyncing,
      syncError,
      subTasks,
      formData,
      refreshTasks,
      getTaskById,
      addCategory,
      deleteCategory,
      addPriority,
      deletePriority,
      syncUnsyncedTasks,
      mergeAppwriteTasks,
      syncDeletedTasks,
      syncAllTasksIntelligently,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
};

// Custom hooks for optimized context usage
export const useAppwriteSync = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useAppwriteSync must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      isSyncing: context.isSyncing,
      syncError: context.syncError,
      syncUnsyncedTasks: context.syncUnsyncedTasks,
      mergeAppwriteTasks: context.mergeAppwriteTasks,
      syncDeletedTasks: context.syncDeletedTasks,
      syncAllTasksIntelligently: context.syncAllTasksIntelligently,
    }),
    [
      context.isSyncing,
      context.syncError,
      context.syncUnsyncedTasks,
      context.mergeAppwriteTasks,
      context.syncDeletedTasks,
      context.syncAllTasksIntelligently,
    ],
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      tasks: context.tasks,
      isLoading: context.isLoading,
      refreshTasks: context.refreshTasks,
      getTaskById: context.getTaskById,
    }),
    [
      context.tasks,
      context.isLoading,
      context.refreshTasks,
      context.getTaskById,
    ],
  );
};

export const useForm = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useForm must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      formData: context.formData,
      setFormData: context.setFormData,
      resetForm: context.resetForm,
      subTasks: context.subTasks,
      setSubTasks: context.setSubTasks,
      addSubTask: context.addSubTask,
      deleteSubTask: context.deleteSubTask,
      clearSubTasks: context.clearSubTasks,
    }),
    [
      context.formData,
      context.setFormData,
      context.resetForm,
      context.subTasks,
      context.setSubTasks,
      context.addSubTask,
      context.deleteSubTask,
      context.clearSubTasks,
    ],
  );
};

export const useCategories = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useCategories must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      categories: context.categories,
      addCategory: context.addCategory,
      deleteCategory: context.deleteCategory,
    }),
    [context.categories, context.addCategory, context.deleteCategory],
  );
};

export const usePriorities = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("usePriorities must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      priorities: context.priorities,
      addPriority: context.addPriority,
      deletePriority: context.deletePriority,
    }),
    [context.priorities, context.addPriority, context.deletePriority],
  );
};

export const useTaskActions = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTaskActions must be used within a TaskProvider");
  }

  return useMemo(
    () => ({
      addTask: context.addTask,
      updateTask: context.updateTask,
      deleteTask: context.deleteTask,
      handleAddTask: context.handleAddTask,
    }),
    [
      context.addTask,
      context.updateTask,
      context.deleteTask,
      context.handleAddTask,
    ],
  );
};

export default TasksContext;
