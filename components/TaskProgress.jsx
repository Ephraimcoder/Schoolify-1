import { Ionicons } from "@expo/vector-icons";
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
          <View
            className={`w-7 h-7 rounded-lg items-center justify-center mr-2 ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="stats-chart-outline"
              size={16}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          </View>

          <Text
            className={`text-lg font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Today's Overview
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full ${
            isDark ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <Text
            className={`font-quicksandSemiBold text-xs ${
              isDark ? "text-gray-200" : "text-gray-700"
            }`}
          >
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>

      {/* Key Metrics */}

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          className={`flex-1 items-center rounded-xl py-3 mx-1 ${
            isDark ? "bg-gray-700/50" : "bg-gray-50"
          }`}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={isDark ? "#9CA3AF" : "#6B7280"}
            style={{ marginBottom: 4 }}
          />

          <Text
            className={`text-lg font-quicksandBold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {todayTasks}
          </Text>

          <Text
            className={`text-xs font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Due Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center rounded-xl py-3 mx-1 ${
            isDark ? "bg-gray-700/50" : "bg-gray-50"
          }`}
        >
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={isDark ? "#9CA3AF" : "#6B7280"}
            style={{ marginBottom: 4 }}
          />

          <Text
            className={`text-lg font-quicksandBold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {overdueTasks}
          </Text>

          <Text
            className={`text-xs font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Overdue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center rounded-xl py-3 mx-1 ${
            isDark ? "bg-gray-700/50" : "bg-gray-50"
          }`}
        >
          <Ionicons
            name="calendar-clear-outline"
            size={20}
            color={isDark ? "#9CA3AF" : "#6B7280"}
            style={{ marginBottom: 4 }}
          />

          <Text
            className={`text-lg font-quicksandBold ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {thisWeekTasks}
          </Text>

          <Text
            className={`text-xs font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
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
              backgroundColor: isDark ? "#6366F1" : "#818CF8",
            }}
          />
        </View>
      </View>

      {/* Study Streak - More Compact */}

      {streak > 0 && (
        <View
          className={`flex-row items-center justify-center mt-3 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
        >
          <View
            className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="flame-outline"
              size={18}
              color={isDark ? "#F97316" : "#EA580C"}
            />
          </View>

          <Text
            className={`text-sm font-quicksandBold ${
              isDark ? "text-orange-400" : "text-orange-600"
            }`}
          >
            {streak} Day{streak !== 1 ? "s" : ""} Streak!
          </Text>
        </View>
      )}
    </View>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
