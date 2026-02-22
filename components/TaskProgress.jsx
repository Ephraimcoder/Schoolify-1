import React, { useContext, useMemo } from "react";
import { Text, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";

const TaskProgress = React.memo(() => {
  const { tasks } = useContext(TasksContext);
  const { isDark, colors } = useTheme();

  const {
    totalTasks,
    completedTasks,
    progress,
    todayTasks,
    overdueTasks,
    thisWeekTasks,
    streak,
  } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.isCompleted).length;

    // Today's tasks
    const today = new Date().toDateString();
    const todayTaskList = tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate).toDateString() === today,
    );
    const todayCompleted = todayTaskList.filter(
      (task) => task.isCompleted,
    ).length;
    const todayTotal = todayTaskList.length;

    // Overdue tasks (all tasks, not just today)
    const overdueTaskList = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0) &&
        !task.isCompleted,
    );

    // This week's tasks (all tasks, not just today)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const thisWeekTaskList = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate <= weekFromNow && taskDate >= new Date().setHours(0, 0, 0, 0)
      );
    });

    // Calculate streak
    const calculateStreak = () => {
      const completedTaskList = tasks.filter((task) => task.isCompleted);
      if (completedTaskList.length === 0) return 0;

      const dates = [
        ...new Set(
          completedTaskList
            .map((task) => {
              // Use updatedAt for completion date, fallback to dueDate
              const completionDate = task.updatedAt || task.dueDate;
              return completionDate
                ? new Date(completionDate).toDateString()
                : null;
            })
            .filter(Boolean),
        ),
      ].sort((a, b) => new Date(b) - new Date(a));

      let streakCount = 0;
      const today = new Date().toDateString();

      for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        if (dates[i] === expectedDate.toDateString()) {
          streakCount++;
        } else {
          break;
        }
      }
      return streakCount;
    };

    return {
      totalTasks: total,
      completedTasks: completed,
      uncompletedTasks: total - completed,
      progress: total > 0 ? completed / total : 0,
      todayTasks: todayTotal,
      completedToday: todayCompleted,
      overdueTasks: overdueTaskList.length,
      thisWeekTasks: thisWeekTaskList.length,
      streak: calculateStreak(),
    };
  }, [tasks]);

  const uncompletedTasks = totalTasks - completedTasks;

  return (
    <View
      className={`p-5 rounded-2xl my-4 mx-2 shadow-sm ${isDark ? "bg-gray-800" : "bg-white"}`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className={`text-lg font-quicksandBold ${isDark ? "text-gray-100" : "text-gray-800"}`}
        >
          Task Progress
        </Text>
        <View className="px-3 py-1 bg-indigo-50 rounded-full">
          <Text className="text-indigo-600 text-xs font-quicksandMedium">
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 items-center">
          <Text className="text-2xl font-quicksandBold text-indigo-600">
            {todayTasks}
          </Text>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Due Today
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-quicksandBold text-red-600">
            {overdueTasks}
          </Text>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Overdue
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-quicksandBold text-green-600">
            {thisWeekTasks}
          </Text>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            This Week
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Completed
          </Text>
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            {completedTasks} of {totalTasks}
          </Text>
        </View>
        <View
          className={`h-2 ${isDark ? "bg-gray-700" : "bg-gray-100"} rounded-full overflow-hidden`}
        >
          <View
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="items-center">
          <View
            className={`w-10 h-10 ${isDark ? "bg-green-900" : "bg-green-50"} rounded-lg items-center justify-center mb-1`}
          >
            <Text className="text-green-600 font-quicksandBold">
              {completedTasks}
            </Text>
          </View>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Done
          </Text>
        </View>

        <View className="items-center">
          <View
            className={`w-10 h-10 ${isDark ? "bg-amber-900" : "bg-amber-50"} rounded-lg items-center justify-center mb-1`}
          >
            <Text className="text-amber-600 font-quicksandBold">
              {uncompletedTasks}
            </Text>
          </View>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Left
          </Text>
        </View>

        <View className="items-center">
          <View
            className={`w-10 h-10 ${isDark ? "bg-indigo-900" : "bg-indigo-50"} rounded-lg items-center justify-center mb-1`}
          >
            <Text className="text-indigo-600 font-quicksandBold">
              {totalTasks}
            </Text>
          </View>
          <Text
            className={`text-xs font-quicksand ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            Total
          </Text>
        </View>
      </View>

      {/* Study Streak */}
      {streak > 0 && (
        <View
          className={`flex-row items-center justify-center mt-4 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
        >
          <Text className="text-2xl mr-2">🔥</Text>
          <Text className="text-sm font-quicksandSemiBold text-orange-600">
            {streak} day{streak !== 1 ? "s" : ""} streak!
          </Text>
        </View>
      )}
    </View>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
