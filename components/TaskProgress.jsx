import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";
const TaskProgress = React.memo(() => {
  const { tasks } = useContext(TasksContext);
  const { isDark, colors } = useTheme();
  const router = useRouter();

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
    <LinearGradient
      colors={isDark ? ["#1F2937", "#111827"] : ["#FFFFFF", "#F9FAFB"]}
      className="p-5 rounded-3xl my-3 mx-2 shadow-lg"
      style={{
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        shadowColor: isDark ? "#000" : "#6366F1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.3 : 0.15,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Header with Enhanced Styling */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-row items-center">
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            className="w-9 h-9 rounded-xl items-center justify-center mr-3 shadow-md"
            style={{
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text className="text-white font-quicksandBold text-base">📊</Text>
          </LinearGradient>
          <View>
            <Text
              className={`text-sm font-quicksandMedium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Your Progress
            </Text>
            <Text
              className={`text-xl font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Today's Overview
            </Text>
          </View>
        </View>
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          className="px-4 py-2 rounded-full shadow-md"
          style={{
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text className="text-white font-quicksandBold text-sm">
            {Math.round(progress * 100)}%
          </Text>
        </LinearGradient>
      </View>

      {/* Enhanced Key Metrics */}
      <View className="flex-row justify-between mb-5">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/Tasks?filter=dueToday")}
          className="flex-1 items-center rounded-2xl py-4 mx-1.5"
          style={{
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.15)"
              : "rgba(59, 130, 246, 0.1)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(59, 130, 246, 0.3)"
              : "rgba(59, 130, 246, 0.2)",
          }}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            className="w-10 h-10 rounded-xl items-center justify-center mb-2 shadow-md"
            style={{
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-white font-quicksandBold text-base">📅</Text>
          </LinearGradient>
          <Text className="text-2xl font-quicksandBold text-blue-500 mb-0.5">
            {todayTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-blue-400" : "text-blue-600"}`}
          >
            Due Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/Tasks?filter=overdue")}
          className="flex-1 items-center rounded-2xl py-4 mx-1.5"
          style={{
            backgroundColor: isDark
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(239, 68, 68, 0.1)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(239, 68, 68, 0.3)"
              : "rgba(239, 68, 68, 0.2)",
          }}
        >
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            className="w-10 h-10 rounded-xl items-center justify-center mb-2 shadow-md"
            style={{
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-white font-quicksandBold text-base">⚠️</Text>
          </LinearGradient>
          <Text className="text-2xl font-quicksandBold text-red-500 mb-0.5">
            {overdueTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-red-400" : "text-red-600"}`}
          >
            Overdue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/Tasks")}
          className="flex-1 items-center rounded-2xl py-4 mx-1.5"
          style={{
            backgroundColor: isDark
              ? "rgba(34, 197, 94, 0.15)"
              : "rgba(34, 197, 94, 0.1)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(34, 197, 94, 0.3)"
              : "rgba(34, 197, 94, 0.2)",
          }}
        >
          <LinearGradient
            colors={["#22C55E", "#16A34A"]}
            className="w-10 h-10 rounded-xl items-center justify-center mb-2 shadow-md"
            style={{
              shadowColor: "#22C55E",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-white font-quicksandBold text-base">📈</Text>
          </LinearGradient>
          <Text className="text-2xl font-quicksandBold text-green-500 mb-0.5">
            {thisWeekTasks}
          </Text>
          <Text
            className={`text-xs font-quicksandMedium ${isDark ? "text-green-400" : "text-green-600"}`}
          >
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Progress Bar */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-3">
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Weekly Progress
          </Text>
          <Text
            className={`text-sm font-quicksandSemiBold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            {completedTasks}/{totalTasks} tasks
          </Text>
        </View>
        <View
          className={`h-3 ${isDark ? "bg-gray-700/50" : "bg-gray-100"} rounded-full overflow-hidden`}
          style={{
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          }}
        >
          <LinearGradient
            colors={["#6366F1", "#8B5CF6", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full rounded-full"
            style={{
              width: `${Math.max(progress * 100, 3)}%`,
              minWidth: 6,
            }}
          />
        </View>
      </View>

      {/* Enhanced Study Streak */}
      {streak > 0 && (
        <LinearGradient
          colors={["rgba(251, 146, 60, 0.1)", "rgba(239, 68, 68, 0.1)"]}
          className="flex-row items-center justify-center mt-4 pt-4 pb-3 px-4 rounded-2xl"
          style={{
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(251, 146, 60, 0.3)"
              : "rgba(251, 146, 60, 0.2)",
          }}
        >
          <LinearGradient
            colors={["#FB923C", "#EF4444"]}
            className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-md"
            style={{
              shadowColor: "#FB923C",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text className="text-white text-base">🔥</Text>
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-base font-quicksandBold text-orange-500">
              {streak} Day{streak !== 1 ? "s" : ""} Streak!
            </Text>
            <Text
              className={`text-xs font-quicksandMedium ${isDark ? "text-orange-400/70" : "text-orange-600/70"}`}
            >
              Keep up the great work!
            </Text>
          </View>
        </LinearGradient>
      )}
    </LinearGradient>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
