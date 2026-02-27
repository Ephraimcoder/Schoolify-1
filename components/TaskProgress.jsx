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

  // Debug log to check progress values
  console.log("TaskProgress Debug:", {
    totalTasks,
    completedTasks,
    progress,
    progressPercentage: Math.round(progress * 100),
  });

  return (
    <View
      className={`p-6 rounded-3xl my-4 mx-2 shadow-lg ${
        isDark ? "bg-gray-800/50 backdrop-blur" : "bg-white/80 backdrop-blur"
      }`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      }}
    >
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl items-center justify-center mr-3">
            <Text className="text-white font-quicksandBold text-sm">📊</Text>
          </View>
          <Text
            className={`text-xl font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Task Progress
          </Text>
        </View>
        <View className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md">
          <Text className="text-white font-quicksandSemiBold text-sm font-semibold">
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View className="flex-row justify-between mb-6">
        <View className="flex-1 items-center bg-blue-50 rounded-2xl py-4 mx-1">
          <View className="w-12 h-12 bg-blue-500 rounded-xl items-center justify-center mb-2">
            <Text className="text-white font-quicksandBold text-lg">📅</Text>
          </View>
          <Text className="text-2xl font-quicksandBold text-blue-600">
            {todayTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-blue-700 mt-1">
            Due Today
          </Text>
        </View>
        <View className="flex-1 items-center bg-red-50 rounded-2xl py-4 mx-1">
          <View className="w-12 h-12 bg-red-500 rounded-xl items-center justify-center mb-2">
            <Text className="text-white font-quicksandBold text-lg">⚠️</Text>
          </View>
          <Text className="text-2xl font-quicksandBold text-red-600">
            {overdueTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-red-700 mt-1">
            Overdue
          </Text>
        </View>
        <View className="flex-1 items-center bg-green-50 rounded-2xl py-4 mx-1">
          <View className="w-12 h-12 bg-green-500 rounded-xl items-center justify-center mb-2">
            <Text className="text-white font-quicksandBold text-lg">📈</Text>
          </View>
          <Text className="text-2xl font-quicksandBold text-green-600">
            {thisWeekTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-green-700 mt-1">
            This Week
          </Text>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row justify-between mb-3">
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Overall Progress
          </Text>
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            {completedTasks} of {totalTasks} tasks
          </Text>
        </View>
        <View
          className={`h-3 ${isDark ? "bg-gray-700" : "bg-gray-100"} rounded-full overflow-hidden shadow-inner`}
        >
          <View
            className="h-full rounded-full shadow-lg"
            style={{
              width: `${Math.max(progress * 100, 2)}%`, // Minimum 2% for visibility
              minWidth: 8, // Minimum 8px width for very small progress
              backgroundColor: "#6366F1", // Explicit indigo color as fallback
              background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)", // Explicit gradient
            }}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <View
            className={`w-12 h-12 ${isDark ? "bg-green-900/50" : "bg-green-50"} rounded-2xl items-center justify-center mb-2 border ${isDark ? "border-green-700/50" : "border-green-200"}`}
          >
            <Text className="text-green-600 font-quicksandBold text-lg">✓</Text>
          </View>
          <Text className="text-xl font-quicksandBold text-green-600">
            {completedTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Completed
          </Text>
        </View>

        <View className="items-center flex-1">
          <View
            className={`w-12 h-12 ${isDark ? "bg-amber-900/50" : "bg-amber-50"} rounded-2xl items-center justify-center mb-2 border ${isDark ? "border-amber-700/50" : "border-amber-200"}`}
          >
            <Text className="text-amber-600 font-quicksandBold text-lg">
              ⏳
            </Text>
          </View>
          <Text className="text-xl font-quicksandBold text-amber-600">
            {uncompletedTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Remaining
          </Text>
        </View>

        <View className="items-center flex-1">
          <View
            className={`w-12 h-12 ${isDark ? "bg-indigo-900/50" : "bg-indigo-50"} rounded-2xl items-center justify-center mb-2 border ${isDark ? "border-indigo-700/50" : "border-indigo-200"}`}
          >
            <Text className="text-indigo-600 font-quicksandBold text-lg">
              📋
            </Text>
          </View>
          <Text className="text-xl font-quicksandBold text-indigo-600">
            {totalTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Total Tasks
          </Text>
        </View>
      </View>

      {/* Study Streak */}
      {streak > 0 && (
        <View
          className={`flex-row items-center justify-center mt-6 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
        >
          <View className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl items-center justify-center mr-3 shadow-md">
            <Text className="text-white text-lg">🔥</Text>
          </View>
          <View>
            <Text className="text-lg font-quicksandBold text-orange-600">
              {streak} Day{streak !== 1 ? "s" : ""} Streak!
            </Text>
            <Text
              className={`text-xs font-quicksandMedium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Keep up the great work!
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
