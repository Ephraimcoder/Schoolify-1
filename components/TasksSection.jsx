import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
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

  // Filter, sort by priority, and limit tasks for TODAY only
  const filteredAndSortedTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks
      .filter((task) => {
        // Only show non-class, incomplete tasks that are due today
        if (task.category === "Class") return false;
        if (!task.dueDate) return false;
        if (task.isCompleted) return false;
        return new Date(task.dueDate).toDateString() === today;
      })
      .sort((a, b) => {
        // Sort by priority (High > Medium > Low)
        const priorityA = PRIORITY_ORDER[a.priority] || 0;
        const priorityB = PRIORITY_ORDER[b.priority] || 0;
        return priorityB - priorityA; // Higher priority first
      })
      .slice(0, 5); // Limit to 5 tasks
  }, [tasks]);

  return (
    <View className="my-4">
      <View className="flex-row justify-between items-center mb-4 mx-2"></View>
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
          <View className="w-full items-center justify-center">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={48}
              color={isDark ? "#6B7280" : "#9CA3AF"}
              className="mb-2"
            />
            <Text
              className={`font-quicksandSemiBold text-center ${
                isDark ? "text-gray-300" : "text-gray-500"
              }`}
            >
              No tasks due today!
            </Text>
            <Text
              className={`font-quicksand text-center text-sm mt-1 ${
                isDark ? "text-gray-400" : "text-gray-400"
              }`}
            >
              Great job staying on top of things 🎉
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

TasksSection.displayName = "TasksSection";

export default TasksSection;
