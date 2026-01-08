import { useMemo } from "react";

// Helper function to normalize dates to start of day for comparison (timezone-safe)
const normalizeDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return new Date(year, month, day);
};

// Helper function to get date key in local timezone
const getDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DateUtils = ({ tasks, selectedDate }) => {
  // Pre-process tasks for calendar (memoized)
  const tasksByDate = useMemo(() => {
    const today = normalizeDate(new Date());
    const dates = {};

    tasks.forEach((task) => {
      if (task.dueDate && !task.isCompleted) {
        const taskDate = normalizeDate(new Date(task.dueDate));
        const dateKey = getDateKey(task.dueDate);

        if (!dates[dateKey]) {
          dates[dateKey] = {
            marked: true,
            hasFutureTasks: false,
            hasPastTasks: false,
            taskIds: [],
          };
        }

        dates[dateKey].taskIds.push(task.id);

        // Track if this date has future or past tasks
        if (taskDate >= today) {
          dates[dateKey].hasFutureTasks = true;
        } else {
          dates[dateKey].hasPastTasks = true;
        }
      }
    });

    return dates;
  }, [tasks]);

  // Build markedDates from pre-processed data (memoized)
  const markedDates = useMemo(() => {
    const dates = { ...tasksByDate };

    // Apply colors based on task dates
    Object.keys(dates).forEach((dateKey) => {
      const dateInfo = dates[dateKey];
      // Orange if there are future tasks, grey if only past tasks
      dateInfo.dotColor = dateInfo.hasFutureTasks ? "#FF6B47" : "#9CA3AF";
      dateInfo.textColor = dateInfo.hasFutureTasks ? undefined : "#9CA3AF";
      dateInfo.disabled = false;
    });

    // Add selected styling
    dates[selectedDate] = {
      ...(dates[selectedDate] || {}),
      selected: true,
      selectedColor: "#FF6B47",
      selectedTextColor: "#FFFFFF",
    };

    return dates;
  }, [tasksByDate, selectedDate]);

  // Filter tasks for selected day (optimized)
  const tasksForDay = useMemo(() => {
    const dateTaskIds = tasksByDate[selectedDate]?.taskIds || [];
    return tasks.filter(
      (task) =>
        dateTaskIds.includes(task.id) && !task.isCompleted && task.dueDate
    );
  }, [tasksByDate, selectedDate, tasks]);

  // Format selected date for display
  const formattedSelectedDate = useMemo(() => {
    return new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return {
    tasksByDate,
    markedDates,
    tasksForDay,
    formattedSelectedDate,
  };
};

export default DateUtils;
