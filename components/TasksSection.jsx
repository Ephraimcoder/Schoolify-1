import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";
import TaskCard from "./TaskCard";

// Priority order for sorting (higher number = higher priority)
const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const TasksSection = React.memo(() => {
  const { tasks } = useContext(TasksContext);
  const { isDark } = useTheme();
  const router = useRouter();

  // Filter, sort by priority, and limit tasks for the NEXT WEEK
  const filteredAndSortedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    oneWeekFromNow.setHours(23, 59, 59, 999); // Set to end of day

    return tasks
      .filter((task) => {
        // Only show non-class, incomplete tasks that are due within the next week
        if (task.category === "Class") return false;
        if (!task.dueDate) return false;
        if (task.isCompleted) return false;

        const taskDueDate = new Date(task.dueDate);
        return taskDueDate >= today && taskDueDate <= oneWeekFromNow;
      })
      .sort((a, b) => {
        // Sort by due date first (earliest first), then by priority
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime(); // Earlier due date first
        }

        // If same due date, sort by priority (High > Medium > Low)
        const priorityA = PRIORITY_ORDER[a.priority] || 0;
        const priorityB = PRIORITY_ORDER[b.priority] || 0;
        return priorityB - priorityA;
      })
      .slice(0, 5); // Limit to 5 tasks
  }, [tasks]);

  const handleSeeAll = () => {
    router.push("/(tabs)/Tasks");
  };

  return (
    <View className="my-3">
      {/* Header with better spacing */}
      <View className="flex-row justify-between items-center mb-3 px-2">
        <View className="flex-row items-center">
          <View className="w-1 h-5 bg-indigo-500 rounded-full mr-2" />
          <Text
            className={`text-lg font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Upcoming Tasks
          </Text>
          <View className="ml-2 px-2 py-1 bg-indigo-100 rounded-full">
            <Text className="text-xs font-quicksandSemiBold text-indigo-700">
              {filteredAndSortedTasks.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSeeAll}
          className="flex-row items-center px-3 py-1.5 bg-indigo-50 rounded-full"
        >
          <Text className="text-indigo-600 font-quicksandSemiBold text-sm mr-1">
            See All
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          filteredAndSortedTasks.length === 0
            ? { flex: 1, justifyContent: "center", alignItems: "center" }
            : {}
        }
      >
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <View className="w-full items-center justify-center py-6">
            <View className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl items-center justify-center mb-3">
              <Ionicons
                name="checkmark-done-circle-outline"
                size={32}
                color="#10B981"
              />
            </View>
            <Text
              className={`font-quicksandSemiBold text-center text-base mb-1 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              All caught up! 🎉
            </Text>
            <Text
              className={`font-quicksand text-center text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No tasks due this week
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

TasksSection.displayName = "TasksSection";

export default TasksSection;
