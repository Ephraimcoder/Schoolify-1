import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// Create the context
export const TasksContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  TASKS: "@Schoolify/tasks",
  CATEGORIES: "@Schoolify/categories",
  PRIORITIES: "@Schoolify/priorities",
};

// Default data
const DEFAULT_CATEGORIES = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "English" },
  { id: "3", name: "Physics" },
  { id: "4", name: "Chemistry" },
  { id: "5", name: "Biology" },
  { id: "6", name: "Computer Science" },
];

const DEFAULT_PRIORITIES = [
  { id: "1", name: "Low" },
  { id: "2", name: "Medium" },
  { id: "3", name: "High" },
];

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
  const getTaskById = useCallback(
    (id) => {
      return tasks.find((task) => task.id === id);
    },
    [tasks]
  );

  // Load data from storage on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tasks and ensure subTasks array exists
        const tasksData = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
        if (tasksData) {
          const parsedTasks = JSON.parse(tasksData);
          const tasksWithSubtasks = parsedTasks.map((task) => ({
            ...task,
            subTasks: task.subTasks || [], // Ensure subTasks is always an array
          }));
          setTasks(tasksWithSubtasks);
        }

        // Load categories or set default
        const categoriesData = await AsyncStorage.getItem(
          STORAGE_KEYS.CATEGORIES
        );
        setCategories(
          categoriesData ? JSON.parse(categoriesData) : DEFAULT_CATEGORIES
        );
        if (!categoriesData) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.CATEGORIES,
            JSON.stringify(DEFAULT_CATEGORIES)
          );
        }

        // Load priorities or set default
        const prioritiesData = await AsyncStorage.getItem(
          STORAGE_KEYS.PRIORITIES
        );
        setPriorities(
          prioritiesData ? JSON.parse(prioritiesData) : DEFAULT_PRIORITIES
        );
        if (!prioritiesData) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.PRIORITIES,
            JSON.stringify(DEFAULT_PRIORITIES)
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save tasks to storage whenever they change
  const saveTasks = async (updatedTasks) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TASKS,
        JSON.stringify(updatedTasks)
      );
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  // Save categories to storage
  const saveCategories = async (updatedCategories) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(updatedCategories)
      );
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  // Save priorities to storage
  const savePriorities = async (updatedPriorities) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRIORITIES,
        JSON.stringify(updatedPriorities)
      );
    } catch (error) {
      console.error("Error saving priorities:", error);
    }
  };

  const handleAddTask = useCallback(() => {
    if (formData.title.trim()) {
      const newTask = {
        ...formData,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        subTasks: subTasks, // Create a new array with all subtask data
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      resetForm();
      clearSubTasks(); // Clear subtasks after adding the task
    }
  }, [formData, subTasks, tasks]);

  const addTask = useCallback(
    (task) => {
      const updatedTasks = [...tasks, task];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    },
    [tasks]
  );

  const deleteTask = useCallback(
    (id) => {
      const updatedTasks = tasks.filter((task) => task.id !== id);
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    },
    [tasks]
  );

  const updateTask = useCallback(
    (id, updatedTask) => {
      const updatedTasks = tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      );
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    },
    [tasks]
  );

  // Add new category
  const addCategory = useCallback(
    (categoryName) => {
      const newCategory = {
        id: Date.now().toString(),
        name: categoryName,
      };
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      saveCategories(updatedCategories);
      return newCategory;
    },
    [categories]
  );

  // Delete category
  const deleteCategory = useCallback(
    (id) => {
      const updatedCategories = categories.filter(
        (category) => category.id !== id
      );
      setCategories(updatedCategories);
      saveCategories(updatedCategories);
    },
    [categories]
  );

  // Add new priority
  const addPriority = useCallback(
    (priorityName) => {
      const newPriority = {
        id: Date.now().toString(),
        name: priorityName,
      };
      const updatedPriorities = [...priorities, newPriority];
      setPriorities(updatedPriorities);
      savePriorities(updatedPriorities);
      return newPriority;
    },
    [priorities]
  );

  // Delete priority
  const deletePriority = useCallback(
    (id) => {
      const updatedPriorities = priorities.filter(
        (priority) => priority.id !== id
      );
      setPriorities(updatedPriorities);
      savePriorities(updatedPriorities);
    },
    [priorities]
  );

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

  // Add subtask
  const addSubTask = useCallback((title) => {
    const newSubTask = {
      id: Date.now().toString(),
      title,
      isCompleted: false,
    };
    setSubTasks((prev) => [...prev, newSubTask]);
  }, []);

  // Delete subtask
  const deleteSubTask = useCallback((index) => {
    setSubTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear subtasks (useful when task is submitted)
  const clearSubTasks = useCallback(() => {
    setSubTasks([]);
  }, []);

  // Refresh tasks from storage (used by pull-to-refresh)
  const refreshTasks = useCallback(async () => {
    try {
      const tasksData = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (tasksData) {
        const parsed = JSON.parse(tasksData);
        const tasksWithSubtasks = parsed.map((t) => ({
          ...t,
          subTasks: t.subTasks || [],
        }));
        setTasks(tasksWithSubtasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      tasks,
      categories,
      priorities,
      isLoading,
      loading: isLoading,
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
    <TasksContext.Provider value={contextValue}>
      {!isLoading ? children : null}
    </TasksContext.Provider>
  );
};

export default TasksContext;
