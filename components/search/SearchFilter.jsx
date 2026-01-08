import { useMemo } from "react";

const SearchFilter = ({ tasks, searchQuery }) => {
  // Debounced search filtering with optimized performance
  const searchResults = useMemo(() => {
    if (!searchQuery?.trim()) {
      return { tasks: tasks || [], matchedSubtasks: [] };
    }

    const query = searchQuery.toLowerCase();
    const matchedTasks = [];
    const matchedSubtasks = [];

    // Pre-compile regex for better performance
    const titleRegex = new RegExp(query, "i");
    const descRegex = new RegExp(query, "i");
    const catRegex = new RegExp(query, "i");
    const priorityRegex = new RegExp(query, "i");
    const dateRegex = new RegExp(query, "i");
    const timeRegex = new RegExp(query, "i");

    // Guard against undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
      return { tasks: [], matchedSubtasks: [] };
    }

    tasks.forEach((task) => {
      // Guard against undefined task
      if (!task || typeof task !== "object") {
        return;
      }

      // Check if parent task matches (optimized string matching)
      const taskMatches =
        (task.title && titleRegex.test(task.title)) ||
        (task.description && descRegex.test(task.description)) ||
        (task.category && catRegex.test(task.category)) ||
        (task.priority && priorityRegex.test(task.priority)) ||
        (task.dueDate && dateRegex.test(task.dueDate)) ||
        (task.dueTime && timeRegex.test(task.dueTime));

      // Check which subtasks match (optimized)
      const matchingSubtasks =
        task.subTasks?.filter(
          (subTask) =>
            subTask && subTask.title && titleRegex.test(subTask.title)
        ) || [];

      // If task matches, include it
      if (taskMatches) {
        matchedTasks.push(task);
        if (matchingSubtasks.length > 0) {
          // Add parent task info to each matching subtask
          const subtasksWithParent = matchingSubtasks.map((subTask) => ({
            subtask: subTask, // Keep original subtask structure
            parentTaskId: task.id,
            parentTaskTitle: task.title,
            parentTaskCategory: task.category,
            parentTaskColor: task.color || "#4F46E5",
          }));
          matchedSubtasks.push(...subtasksWithParent);
        }
      } else if (matchingSubtasks.length > 0) {
        // If only subtasks match, include parent task
        matchedTasks.push(task);
        // Add parent task info to each matching subtask
        const subtasksWithParent = matchingSubtasks.map((subTask) => ({
          subtask: subTask, // Keep original subtask structure
          parentTaskId: task.id,
          parentTaskTitle: task.title,
          parentTaskCategory: task.category,
          parentTaskColor: task.color || "#4F46E5",
        }));
        matchedSubtasks.push(...subtasksWithParent);
      }
    });

    return { tasks: matchedTasks, matchedSubtasks };
  }, [tasks, searchQuery]);

  return searchResults;
};

export default SearchFilter;
