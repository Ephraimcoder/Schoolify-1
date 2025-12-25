import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { database } from "../database/database";

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
  color: m.color || undefined,
});

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const taskCol = database.collections.get("tasks");
    const models = await taskCol.query().fetch();
    setTasks(models.map(mapTaskModelToUi));
  }, []);

  // Load initial data from WatermelonDB
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load tasks
      const tasksCollection = database.collections.get("tasks");
      const loadedTasks = await tasksCollection.query().fetch();
      setTasks(loadedTasks.map(mapTaskModelToUi));

      // Load categories
      const categoriesCollection = database.collections.get("categories");
      let loadedCategories = await categoriesCollection.query().fetch();

      // If no categories exist, create default ones
      if (loadedCategories.length === 0) {
        await database.write(async () => {
          for (const category of DEFAULT_CATEGORIES) {
            await categoriesCollection.create((cat) => {
              cat.name = category.name;
            });
          }
        });
        loadedCategories = await categoriesCollection.query().fetch();
      }
      setCategories(loadedCategories);

      // Load priorities
      const prioritiesCollection = database.collections.get("priorities");
      let loadedPriorities = await prioritiesCollection.query().fetch();

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
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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
          });
        });

        await refreshTasks();
        return { success: true };
      } catch (error) {
        console.error("Error adding task:", error);
        throw error;
      }
    },
    [refreshTasks]
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
          });
        });

        await refreshTasks();
        return { success: true };
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },
    [refreshTasks]
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
        console.error("Error deleting task:", error);
        throw error;
      }
    },
    [refreshTasks]
  );

  const getTaskById = useCallback(
    (id) => {
      return tasks.find((task) => task.id === id);
    },
    [tasks]
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
          });
        });
        await refreshTasks();
        resetForm();
      } catch (e) {
        console.error("Error creating task:", e);
      }
    },
    [formData, subTasks, resetForm, refreshTasks]
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

  const addCategory = useCallback(async (categoryName) => {
    try {
      const col = database.get("categories");
      let created;
      await database.write(async () => {
        created = await col.create((rec) => {
          rec.name = categoryName;
        });
      });
      return { id: created.id, name: categoryName };
    } catch (e) {
      console.error("Error adding category:", e);
      return null;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id) => {
    try {
      await database.write(async () => {
        const model = await database.get("categories").find(id);
        await model.markAsDeleted();
      });
    } catch (e) {
      console.error("Error deleting category:", e);
    }
  }, []);

  // Add new priority
  const addPriority = useCallback(async (priorityName) => {
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
        });
      });
      return { id: created.id, name: priorityName };
    } catch (e) {
      console.error("Error adding priority:", e);
      return null;
    }
  }, []);

  // Delete priority
  const deletePriority = useCallback(async (id) => {
    try {
      await database.write(async () => {
        const model = await database.get("priorities").find(id);
        await model.markAsDeleted();
      });
    } catch (e) {
      console.error("Error deleting priority:", e);
    }
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      categories,
      priorities,
      isLoading,
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
    }),
    [
      tasks,
      categories,
      priorities,
      isLoading,
      subTasks,
      formData,
      handleAddTask,
      resetForm,
      addTask,
      updateTask,
      deleteTask,
      addSubTask,
      deleteSubTask,
      clearSubTasks,
      getTaskById,
      refreshTasks,
      addCategory,
      deleteCategory,
      addPriority,
      deletePriority,
    ]
  );

  return (
    <TasksContext.Provider value={value}>
      {!isLoading ? children : null}
    </TasksContext.Provider>
  );
};

export default TasksContext;
