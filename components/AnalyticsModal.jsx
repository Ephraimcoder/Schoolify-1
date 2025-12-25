import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const AnalyticsModal = ({ visible, onClose, tasks }) => {
  const stats = useMemo(() => {
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

    return {
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
  }, [tasks]);

  function calculateStreak(tasks) {
    // Sort completed tasks by completion date in descending order (newest first)
    const completedTasks = tasks
      .filter((t) => t.isCompleted && t.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    if (completedTasks.length === 0) return 0;

    // Convert all dates to YYYY-MM-DD format for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the most recent task was completed today or yesterday
    const lastCompleted = new Date(completedTasks[0].completedAt);
    lastCompleted.setHours(0, 0, 0, 0);

    // If the last completed task is before yesterday, there's no active streak
    if (lastCompleted < yesterday) return 0;

    let streak = 1;
    let currentDate = lastCompleted;

    // Check for consecutive days
    for (let i = 1; i < completedTasks.length; i++) {
      const taskDate = new Date(completedTasks[i].completedAt);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate - taskDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Next day in streak
        streak++;
        currentDate = taskDate;
      } else if (diffDays > 1) {
        // Streak broken
        break;
      }
      // If diffDays === 0, it's the same day, so we skip it
    }

    return streak;
  }

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

  const screenWidth = Dimensions.get("window").width - 80;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View className="bg-white rounded-2xl p-6 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-2xl font-quicksandBold">
                Task Analytics
              </Text>
              <Text className="text-gray-500 font-quicksand">
                Your productivity insights
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
            {/* Task Overview */}
            <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
              <Text className="text-lg font-quicksandBold mb-4">
                Task Overview
              </Text>

              {/* Completion Stats */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-gray-600 font-quicksand">
                    Completion Rate
                  </Text>
                  <Text className="font-quicksandBold text-indigo-600">
                    {stats.completionRate}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm text-gray-500">
                    {stats.completed} completed • {stats.pending} remaining
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {stats.total} total
                  </Text>
                </View>
              </View>

              {/* Streak */}
              <View className="mt-5 pt-4 border-t border-gray-100">
                <View className="flex-row items-start justify-between px-1">
                  <View className="flex-row items-center space-x-3 gap-2">
                    <View className="bg-indigo-50 p-2.5 rounded-full">
                      <Ionicons name="flame" size={18} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-gray-500 font-quicksand text-[13px] mb-0.5">
                        Current Streak
                      </Text>
                      <View className="flex-row items-baseline space-x-1.5">
                        <Text className="text-2xl font-quicksandBold text-indigo-600">
                          {stats.streak}
                        </Text>
                        <Text className="text-gray-500 font-quicksand text-[13px] mb-0.5">
                          {stats.streak === 1 ? "day" : "days"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end max-w-[45%]">
                    <Text className="text-gray-500 font-quicksand text-[13px] mb-0.5 text-right">
                      Most Productive
                    </Text>
                    <View className="flex-row items-center space-x-1.5 bg-indigo-50 rounded-lg px-2.5 py-1.5">
                      <Text
                        className="text-gray-700 font-quicksandBold text-[13px] text-right"
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {stats.mostProductiveDay}
                      </Text>
                    </View>
                  </View>
                </View>
                {stats.streak > 0 && (
                  <View className="mt-3 bg-indigo-50 rounded-lg p-2.5 mx-1">
                    <Text className="text-indigo-700 font-quicksand text-xs text-center">
                      {stats.streak >= 3 ? "🔥 " : "✨ "}
                      {getStreakMessage(stats.streak)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Categories */}
            {Object.keys(stats.categoryCounts).length > 0 && (
              <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
                <Text className="text-lg font-quicksandBold mb-3">
                  Tasks by Category
                </Text>
                <View className="space-y-3">
                  {Object.entries(stats.categoryCounts).map(
                    ([category, count], index) => {
                      const colors = [
                        "#4F46E5",
                        "#10B981",
                        "#F59E0B",
                        "#EF4444",
                        "#8B5CF6",
                      ];
                      const color = colors[index % colors.length];
                      const percentage = Math.round(
                        (count / stats.total) * 100
                      );

                      return (
                        <View
                          key={`category-${index}`}
                          className="space-y-1 gap-4"
                        >
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <View
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: color }}
                              />
                              <Text className="text-gray-700 font-quicksand">
                                {category}
                              </Text>
                            </View>
                            <Text className="text-gray-500 font-quicksand">
                              {count} {count === 1 ? "task" : "tasks"} •{" "}
                              {percentage}%
                            </Text>
                          </View>
                          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                                opacity: 0.7,
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
            <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
              <Text className="text-lg font-quicksandBold mb-3">
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
                      className="space-y-1 gap-4"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: color }}
                          />
                          <Text className="text-gray-700 font-quicksand">
                            {priorityLabel} Priority
                          </Text>
                        </View>
                        <Text className="text-gray-500 font-quicksand">
                          {count} {count === 1 ? "task" : "tasks"} •{" "}
                          {percentage}%
                        </Text>
                      </View>
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                            opacity: 0.7,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Productivity Tips */}
            <View className="bg-indigo-50 rounded-xl p-4 mb-4">
              <Text className="font-quicksandBold text-indigo-800 mb-2">
                💡 Productivity Tip
              </Text>
              <Text className="text-indigo-700 font-quicksand text-sm">
                {getProductivityTip(
                  stats.completionRate,
                  stats.streak,
                  stats.mostProductiveDay
                )}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function getProductivityTip(completionRate, streak, mostProductiveDay) {
  if (completionRate >= 80) {
    return `Amazing! You're completing ${completionRate}% of your tasks. Keep up the great work!`;
  } else if (streak >= 3) {
    return `You're on a ${streak}-day streak! Try to tackle your most challenging task first thing in the morning.`;
  } else if (mostProductiveDay !== "No data") {
    return `Your most productive day is ${mostProductiveDay}. Schedule important tasks for then!`;
  } else {
    return "Start by completing small tasks to build momentum. You've got this!";
  }
}

function getStreakMessage(streak) {
  if (streak === 0) return "Complete tasks to start a streak!";
  if (streak === 1) return "Great start! Come back tomorrow to keep it going.";
  if (streak < 5) return `You're on a roll! ${streak} days in a row!`;
  if (streak < 10) return `Amazing! ${streak} days of productivity!`;
  return `Incredible ${streak}-day streak! You're unstoppable!`;
}

export default AnalyticsModal;
