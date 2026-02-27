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
          <View className="w-full items-center justify-center py-8">
            <View className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl items-center justify-center mb-4">
              <Ionicons
                name="checkmark-done-circle-outline"
                size={40}
                color="#10B981"
              />
            </View>
            <Text
              className={`font-quicksandSemiBold text-center text-lg mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No tasks due this week!
            </Text>
            <Text
              className={`font-quicksand text-center text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
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
