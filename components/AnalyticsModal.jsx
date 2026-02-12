import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { GamificationAnalytics } from "../components/analytics";
import { useTheme } from "../context/ThemeContext";

// Reuse the streak calculation from TaskProgress
const calculateStreak = (tasks) => {
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
        .filter(Boolean)
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

export const AnalyticsModal = ({ visible, onClose, tasks }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const { isDark } = useTheme();

  const stats = useMemo(() => {
    setIsCalculating(true);

    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = tasks.length - completed;

    const priorityCounts = tasks.reduce((acc, task) => {
      if (task.priority) {
        const priority = task.priority.toLowerCase();
        acc[priority] = (acc[priority] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate category distribution
    const categoryCounts = tasks.reduce((acc, task) => {
      const category = task.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Calculate completion trend (last 7 days)
    const today = new Date();
    const last7Days = Array(7)
      .fill(0)
      .map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split("T")[0],
          completed: 0,
        };
      });

    tasks.forEach((task) => {
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt)
          .toISOString()
          .split("T")[0];
        const day = last7Days.find((d) => d.date === completedDate);
        if (day) day.completed++;
      }
    });

    const result = {
      total: tasks.length,
      completed,
      pending,
      completionRate:
        tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      priorityCounts,
      categoryCounts,
      weeklyTrend: last7Days.map((d) => d.completed),
      streak: calculateStreak(tasks),
      mostProductiveDay: getMostProductiveDay(tasks),
    };

    // Simulate async processing for better UX
    setTimeout(() => setIsCalculating(false), 100);

    return result;
  }, [tasks]);

  function getMostProductiveDay(tasks) {
    const dayCount = {};
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Count completed tasks by day of week
    tasks.forEach((task) => {
      // Check for different possible completion timestamp field names
      const completionDate =
        task.completedAt || task.completedDate || task.dateCompleted;

      if (completionDate) {
        try {
          const date = new Date(completionDate);
          if (!isNaN(date.getTime())) {
            // Check if date is valid
            const day = date.getDay();
            dayCount[day] = (dayCount[day] || 0) + 1;
          } else {
            toast.error(
              `Task ${task.id} has invalid date format:`,
              completionDate
            );
          }
        } catch (e) {
          toast.error("Error processing task date:", e);
        }
      }
    });

    // If no completed tasks, return a helpful message
    if (Object.keys(dayCount).length === 0) {
      return "Complete tasks to see your most productive day";
    }

    // Find the day with the most completed tasks
    const mostProductive = Object.entries(dayCount).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    return days[mostProductive[0]];
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View
          className={`rounded-2xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
          style={{
            maxHeight: "95%",
            minHeight: "70%",
            width: "100%",
            maxWidth: 500,
            alignSelf: "center",
          }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text
                className={`text-2xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Task Analytics
              </Text>
              <Text
                className={`font-quicksand ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Your productivity insights
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="mt-2"
            contentContainerStyle={{ paddingBottom: 20 }}
            nestedScrollEnabled={true}
          >
            {/* Loading State */}
            {isCalculating ? (
              <View className="flex-1 items-center justify-center py-20">
                <View
                  className={`w-12 h-12 border-4 border-t-indigo-600 rounded-full animate-spin mb-4 ${
                    isDark ? "border-indigo-400" : "border-indigo-200"
                  }`}
                />
                <Text
                  className={`font-quicksand ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Calculating analytics...
                </Text>
                <Text
                  className={`font-quicksand text-sm mt-2 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Please wait a moment
                </Text>
              </View>
            ) : (
              <>
                {/* Task Overview */}
                <View
                  className={`mb-6 rounded-xl p-4 border shadow-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <Text
                    className={`text-lg font-quicksandBold mb-4 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Task Overview
                  </Text>

                  {/* Completion Stats */}
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text
                        className={`font-quicksandMedium ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}
                      >
                        Completion Rate
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          isDark ? "bg-indigo-900/30" : "bg-indigo-100"
                        }`}
                      >
                        <Text
                          className={`font-quicksandBold text-sm ${
                            isDark ? "text-indigo-300" : "text-indigo-700"
                          }`}
                        >
                          {stats.completionRate}%
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`h-3 rounded-full overflow-hidden ${
                        isDark ? "bg-purple-900/30" : "bg-gray-100"
                      }`}
                    >
                      <View
                        className={`h-full bg-gradient-to-r rounded-full shadow-sm ${
                          isDark
                            ? "from-purple-500 to-purple-600"
                            : "from-indigo-500 to-indigo-600"
                        }`}
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-3">
                      <Text
                        className={`text-sm font-quicksand ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {stats.completed} completed • {stats.pending} remaining
                      </Text>
                      <Text
                        className={`text-sm font-quicksand ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {stats.total} total
                      </Text>
                    </View>
                  </View>

                  {/* Streak */}
                  <View
                    className={`mt-5 pt-4 border-t ${
                      isDark ? "border-gray-600" : "border-gray-100"
                    }`}
                  >
                    <View className="flex-row items-center gap-3 px-1">
                      <View className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-full shadow-sm">
                        <Ionicons name="flame" size={18} color="white" />
                      </View>
                      <View>
                        <Text
                          className={`font-quicksandMedium text-[13px] mb-0.5 ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Current Streak
                        </Text>
                        <View className="flex-row items-baseline space-x-1.5">
                          <Text
                            className={`text-2xl font-quicksandBold ${
                              isDark ? "text-purple-400" : "text-purple-600"
                            }`}
                          >
                            {stats.streak}
                          </Text>
                          <Text
                            className={`font-quicksand text-[13px] mb-0.5 ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {stats.streak === 1 ? "day" : "days"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {stats.streak > 0 && (
                      <View
                        className={`mt-3 rounded-lg p-3 mx-1 border ${
                          isDark
                            ? "bg-purple-900/20 border-purple-700/30"
                            : "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
                        }`}
                      >
                        <Text
                          className={`font-quicksand text-xs text-center ${
                            isDark ? "text-purple-300" : "text-purple-700"
                          }`}
                        >
                          {stats.streak >= 3 ? "🔥 " : "✨ "}
                          {getStreakMessage(stats.streak)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Categories */}
                {Object.keys(stats.categoryCounts).length > 0 && (
                  <View
                    className={`mb-6 rounded-xl p-4 border shadow-sm ${
                      isDark
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-lg font-quicksandBold mb-4 ${
                        isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      Tasks by Category
                    </Text>
                    <View className="space-y-4 gap-2">
                      {Object.entries(stats.categoryCounts).map(
                        ([category, count], index) => {
                          const colors = [
                            "#4F46E5",
                            "#10B981",
                            "#F59E0B",
                            "#EF4444",
                            "#8B5CF6",
                            "#3B82F6", // added new color
                            "#F97316", // added new color
                          ];
                          const color = colors[index % colors.length];
                          const percentage = Math.round(
                            (count / stats.total) * 100
                          );

                          return (
                            <View
                              key={`category-${index}`}
                              className="space-y-2"
                            >
                              <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                  <View
                                    className="w-4 h-4 rounded-full mr-3 shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                  <Text
                                    className={`font-quicksandMedium ${
                                      isDark ? "text-gray-300" : "text-gray-700"
                                    }`}
                                  >
                                    {category}
                                  </Text>
                                </View>
                                <View className="flex-row items-center space-x-2">
                                  <View
                                    className="px-2 py-1 rounded-full"
                                    style={{ backgroundColor: `${color}20` }}
                                  >
                                    <Text
                                      className="text-xs font-quicksandBold"
                                      style={{ color }}
                                    >
                                      {percentage}%
                                    </Text>
                                  </View>
                                  <Text
                                    className={`font-quicksand text-sm ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    {count} {count === 1 ? "task" : "tasks"}
                                  </Text>
                                </View>
                              </View>
                              <View
                                className={`h-2 rounded-full overflow-hidden ${
                                  isDark ? "bg-gray-700" : "bg-gray-100"
                                }`}
                              >
                                <View
                                  className="h-full rounded-full shadow-sm"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                    opacity: 0.8,
                                  }}
                                />
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>
                )}

                {/* Priority */}
                <View
                  className={`mb-6 rounded-xl p-4 border shadow-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <Text
                    className={`text-lg font-quicksandBold mb-4 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Tasks by Priority
                  </Text>
                  <View className="space-y-3">
                    {["high", "medium", "low"].map((priority) => {
                      // Initialize count to 0 if priority doesn't exist
                      const count = stats.priorityCounts[priority] || 0;

                      const priorityColors = {
                        high: "#EF4444",
                        medium: "#F59E0B",
                        low: "#10B981",
                      };

                      const color = priorityColors[priority] || "#6B7280";
                      const percentage =
                        stats.total > 0
                          ? Math.round((count / stats.total) * 100)
                          : 0;
                      const priorityLabel =
                        priority.charAt(0).toUpperCase() + priority.slice(1);

                      return (
                        <View
                          key={`priority-${priority}`}
                          className="space-y-2 gap-2"
                        >
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <View
                                className="w-4 h-4 rounded-full mr-3 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <Text
                                className={`font-quicksandMedium ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {priorityLabel} Priority
                              </Text>
                            </View>
                            <View className="flex-row items-center space-x-2">
                              <View
                                className="px-2 py-1 rounded-full"
                                style={{ backgroundColor: `${color}20` }}
                              >
                                <Text
                                  className="text-xs font-quicksandBold"
                                  style={{ color }}
                                >
                                  {percentage}%
                                </Text>
                              </View>
                              <Text
                                className={`font-quicksand text-sm ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {count} {count === 1 ? "task" : "tasks"}
                              </Text>
                            </View>
                          </View>
                          <View
                            className={`h-2 rounded-full overflow-hidden ${
                              isDark ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <View
                              className="h-full rounded-full shadow-sm"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                                opacity: 0.8,
                              }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <GamificationAnalytics tasks={tasks} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function getStreakMessage(streak) {
  if (streak === 0) return "Complete tasks to start a streak!";
  if (streak === 1) return "Great start! Come back tomorrow to keep it going.";
  if (streak < 5) return `You're on a roll! ${streak} days in a row!`;
  if (streak < 10) return `Amazing! ${streak} days of productivity!`;
  return `Incredible ${streak}-day streak! You're unstoppable!`;
}

export default AnalyticsModal;
