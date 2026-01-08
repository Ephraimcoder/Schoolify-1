import { useMemo } from "react";

const DateProcessor = ({ tasks }) => {
  // Pre-process all date-related calculations
  const processedTasks = useMemo(() => {
    // Guard against undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return tasks.map((task) => {
      // Guard against undefined task
      if (!task || typeof task !== "object") {
        return {
          ...task,
          dueDateObj: null,
          dueDateStart: null,
          isOverdue: false,
          formattedDate: "No date",
          formattedTime: "--:--",
          dateKey: null,
        };
      }

      const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
      const dueDateStart = dueDateObj
        ? new Date(
            dueDateObj.getFullYear(),
            dueDateObj.getMonth(),
            dueDateObj.getDate()
          )
        : null;

      return {
        ...task,
        dueDateObj,
        dueDateStart,
        isOverdue: dueDateStart ? dueDateStart < todayStart : false,
        formattedDate: dueDateObj
          ? dueDateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "No date",
        formattedTime: task.dueTime
          ? new Date(task.dueTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--",
        dateKey: dueDateObj ? dueDateObj.toISOString().split("T")[0] : null,
      };
    });
  }, [tasks]);

  return processedTasks;
};

export default DateProcessor;
