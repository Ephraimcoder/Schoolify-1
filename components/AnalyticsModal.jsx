import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

export const AnalyticsModal = ({ visible, onClose, tasks }) => {
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = tasks.length - completed;
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
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
    // Sort completed tasks by completion date
    const completedTasks = tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    if (completedTasks.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(completedTasks[0].completedAt);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < completedTasks.length; i++) {
      const taskDate = new Date(completedTasks[i].completedAt);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate - taskDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentDate = taskDate;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
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

    tasks.forEach((task) => {
      if (task.completedAt) {
        const day = new Date(task.completedAt).getDay();
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });

    if (Object.keys(dayCount).length === 0) return "No data";

    const mostProductive = Object.entries(dayCount).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return days[mostProductive[0]];
  }

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4F46E5",
    },
  };

  const screenWidth = Dimensions.get("window").width - 80;

  const priorityData = [
    {
      name: "High",
      count: stats.priorityCounts["3"] || 0,
      color: "#EF4444",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Medium",
      count: stats.priorityCounts["2"] || 0,
      color: "#F59E0B",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Low",
      count: stats.priorityCounts["1"] || 0,
      color: "#10B981",
      legendFontColor: "#7F7F7F",
    },
  ];

  const categoryData = Object.entries(stats.categoryCounts).map(
    ([name, count]) => ({
      name,
      count,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      legendFontColor: "#7F7F7F",
    })
  );

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
            {/* Quick Stats */}
            <View className="flex-row flex-wrap justify-between mb-6">
              <View className="w-[48%] bg-blue-50 p-4 rounded-xl mb-3">
                <Text className="text-blue-800 font-quicksandBold text-2xl">
                  {stats.total}
                </Text>
                <Text className="text-blue-600 font-quicksand">
                  Total Tasks
                </Text>
              </View>
              <View className="w-[48%] bg-green-50 p-4 rounded-xl mb-3">
                <Text className="text-green-800 font-quicksandBold text-2xl">
                  {stats.completed}
                </Text>
                <Text className="text-green-600 font-quicksand">Completed</Text>
              </View>
              <View className="w-[48%] bg-purple-50 p-4 rounded-xl">
                <Text className="text-purple-800 font-quicksandBold text-2xl">
                  {stats.streak} {stats.streak === 1 ? "day" : "days"}
                </Text>
                <Text className="text-purple-600 font-quicksand">
                  Current Streak
                </Text>
              </View>
              <View className="w-[48%] bg-yellow-50 p-4 rounded-xl">
                <Text className="text-yellow-800 font-quicksandBold text-2xl">
                  {stats.completionRate}%
                </Text>
                <Text className="text-yellow-600 font-quicksand">
                  Completion Rate
                </Text>
              </View>
            </View>

            {/* Weekly Trend */}
            <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
              <Text className="text-lg font-quicksandBold mb-3">
                Weekly Completion Trend
              </Text>
              <BarChart
                data={{
                  labels: ["S", "M", "T", "W", "T", "F", "S"],
                  datasets: [
                    {
                      data: stats.weeklyTrend,
                    },
                  ],
                }}
                width={screenWidth}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  ...chartConfig,
                  backgroundGradientFrom: "#F9FAFB",
                  backgroundGradientTo: "#F9FAFB",
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                fromZero
                showBarTops={false}
                withInnerLines={false}
                withOuterLines={false}
              />
              <View className="mt-2 flex-row justify-between items-center">
                <Text className="text-gray-500 font-quicksand text-xs">
                  Most productive: {stats.mostProductiveDay}
                </Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></View>
                  <Text className="text-indigo-600 font-quicksand text-xs">
                    Tasks completed
                  </Text>
                </View>
              </View>
            </View>

            {/* Priority Distribution */}
            <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
              <Text className="text-lg font-quicksandBold mb-3">
                Tasks by Priority
              </Text>
              <View className="flex-row">
                <View className="w-1/2 items-center">
                  <PieChart
                    data={priorityData}
                    width={screenWidth / 2}
                    height={180}
                    chartConfig={chartConfig}
                    accessor={"count"}
                    backgroundColor={"transparent"}
                    paddingLeft={"0"}
                    center={[0, 0]}
                    absolute
                    hasLegend={false}
                  />
                </View>
                <View className="w-1/2 justify-center pl-4">
                  {priorityData.map((item, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <Text className="text-gray-700 font-quicksand">
                        {item.name}: {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Category Distribution */}
            {Object.keys(stats.categoryCounts).length > 0 && (
              <View className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
                <Text className="text-lg font-quicksandBold mb-3">
                  Tasks by Category
                </Text>
                <View className="flex-row flex-wrap">
                  {Object.entries(stats.categoryCounts).map(
                    ([category, count], index) => (
                      <View
                        key={index}
                        className="flex-row items-center bg-gray-50 rounded-full px-3 py-1.5 mr-2 mb-2"
                      >
                        <View
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{
                            backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                          }}
                        />
                        <Text className="text-gray-700 font-quicksand text-sm">
                          {category}: {count}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}

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

export default AnalyticsModal;
