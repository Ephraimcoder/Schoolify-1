import { useMemo } from "react";

const TaskSorter = ({ filteredTasks, sortOption, activeFilter }) => {
  // Priority ranking helper (memoized)
  const priorityRank = useMemo(() => {
    const rank = (p) => {
      const v = (p || "").toLowerCase();
      if (v === "high") return 3;
      if (v === "medium") return 2;
      if (v === "low") return 1;
      return 0;
    };
    return rank;
  }, []);

  // Apply status filters
  const statusFilteredTasks = useMemo(() => {
    // Guard against undefined filteredTasks
    if (!filteredTasks || !Array.isArray(filteredTasks)) {
      return [];
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeFilter) {
      case "completed":
        return filteredTasks.filter((task) => task && task.isCompleted);

      case "incomplete":
        return filteredTasks.filter((task) => task && !task.isCompleted);

      case "overdue":
        return filteredTasks.filter((task) => {
          if (!task || task.isCompleted || !task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        });

      case "dueToday":
        return filteredTasks.filter((task) => {
          if (!task || !task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });

      case "classes":
        return filteredTasks.filter(
          (task) => task && task.category === "Class",
        );

      default: // "all"
        return filteredTasks;
    }
  }, [filteredTasks, activeFilter]);

  // Group tasks by date (optimized)
  const tasksByDate = useMemo(() => {
    return statusFilteredTasks.reduce((acc, task) => {
      if (!task) return acc; // Guard against undefined task

      const date = task.dueDate
        ? new Date(task.dueDate).toDateString()
        : "No Date";
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});
  }, [statusFilteredTasks]);

  // Sort tasks within groups
  const sortTasksInGroup = useMemo(() => {
    return (arr) => {
      if (!arr || !Array.isArray(arr)) return []; // Guard against undefined array

      const copy = [...arr];
      switch (sortOption) {
        case "createdNew":
          return copy.sort(
            (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
          );
        case "createdOld":
          return copy.sort(
            (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
          );
        case "priorityHighLow":
          return copy.sort(
            (a, b) => priorityRank(b.priority) - priorityRank(a.priority),
          );
        case "priorityLowHigh":
          return copy.sort(
            (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
          );
        case "dueDateDesc":
        case "dueDateAsc":
        default:
          return copy; // Keep original order for date sorting at group level
      }
    };
  }, [sortOption, priorityRank]);

  // Sort date groups (optimized)
  const sortedDates = useMemo(() => {
    let dates = Object.keys(tasksByDate).sort((a, b) => {
      if (a === "No Date") return 1;
      if (b === "No Date") return -1;
      return new Date(a) - new Date(b);
    });

    if (sortOption === "dueDateDesc") {
      const noDate = dates.includes("No Date");
      const datesOnly = dates.filter((d) => d !== "No Date").reverse();
      dates = noDate ? [...datesOnly, "No Date"] : datesOnly;
    }

    return dates;
  }, [tasksByDate, sortOption]);

  // Apply in-group sorting
  const tasksByDateSorted = useMemo(() => {
    return Object.fromEntries(
      sortedDates.map((d) => [d, sortTasksInGroup(tasksByDate[d])]),
    );
  }, [tasksByDate, sortedDates, sortTasksInGroup]);

  // Flat mode for created date sorting and priority sorting
  const flatMode =
    sortOption === "createdNew" ||
    sortOption === "createdOld" ||
    sortOption === "priorityHighLow" ||
    sortOption === "priorityLowHigh";
  const flatTasks = useMemo(() => {
    if (!flatMode || !statusFilteredTasks) return [];
    const arr = [...statusFilteredTasks];
    if (sortOption === "createdNew") {
      return arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    if (sortOption === "createdOld") {
      return arr.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    }
    if (sortOption === "priorityHighLow") {
      return arr.sort(
        (a, b) => priorityRank(b.priority) - priorityRank(a.priority),
      );
    }
    if (sortOption === "priorityLowHigh") {
      return arr.sort(
        (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
      );
    }
    return arr;
  }, [statusFilteredTasks, sortOption, flatMode, priorityRank]);

  return {
    statusFilteredTasks,
    tasksByDateSorted,
    sortedDates,
    flatMode,
    flatTasks,
  };
};

export default TaskSorter;
