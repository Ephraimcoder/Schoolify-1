import React, { useContext, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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

  // // Debug log to check progress values
  // console.log("TaskProgress Debug:", {
  //   totalTasks,
  //   completedTasks,
  //   progress,
  //   progressPercentage: Math.round(progress * 100),
  // });

  return (
    <View
      className={`p-4 rounded-2xl my-3 mx-2 shadow-md ${
        isDark ? "bg-gray-800/50 backdrop-blur" : "bg-white/80 backdrop-blur"
      }`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg items-center justify-center mr-2">
            <Text className="text-white font-quicksandBold text-xs">📊</Text>
          </View>
          <Text
            className={`text-lg font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Today's Overview
          </Text>
        </View>
        <View className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
          <Text className="text-white font-quicksandSemiBold text-xs">
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity className="flex-1 items-center bg-blue-50 rounded-xl py-3 mx-1">
          <View className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center mb-1">
            <Text className="text-white font-quicksandBold text-sm">📅</Text>
          </View>
          <Text className="text-lg font-quicksandBold text-blue-600">
            {todayTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-blue-700">
            Due Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center bg-red-50 rounded-xl py-3 mx-1">
          <View className="w-8 h-8 bg-red-500 rounded-lg items-center justify-center mb-1">
            <Text className="text-white font-quicksandBold text-sm">⚠️</Text>
          </View>
          <Text className="text-lg font-quicksandBold text-red-600">
            {overdueTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-red-700">
            Overdue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center bg-green-50 rounded-xl py-3 mx-1">
          <View className="w-8 h-8 bg-green-500 rounded-lg items-center justify-center mb-1">
            <Text className="text-white font-quicksandBold text-sm">📈</Text>
          </View>
          <Text className="text-lg font-quicksandBold text-green-600">
            {thisWeekTasks}
          </Text>
          <Text className="text-xs font-quicksandMedium text-green-700">
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View>
        <View className="flex-row justify-between mb-2">
          <Text
            className={`text-xs font-quicksandSemiBold ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Weekly Progress
          </Text>
          <Text
            className={`text-xs font-quicksandSemiBold ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {completedTasks}/{totalTasks} tasks
          </Text>
        </View>
        <View
          className={`h-2 ${isDark ? "bg-gray-700" : "bg-gray-100"} rounded-full overflow-hidden`}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.max(progress * 100, 2)}%`,
              minWidth: 4,
              backgroundColor: "#6366F1",
            }}
          />
        </View>
      </View>

      {/* Study Streak - More Compact */}
      {streak > 0 && (
        <View
          className={`flex-row items-center justify-center mt-3 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
        >
          <View className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg items-center justify-center mr-2">
            <Text className="text-white text-sm">🔥</Text>
          </View>
          <Text className="text-sm font-quicksandBold text-orange-600">
            {streak} Day{streak !== 1 ? "s" : ""} Streak!
          </Text>
        </View>
      )}
    </View>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
