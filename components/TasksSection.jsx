import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import TaskCard from "./TaskCard";

// Priority order for sorting (higher number = higher priority)
const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const TasksSection = React.memo(() => {
  const { tasks } = useContext(TasksContext);

  // Filter, sort by priority, and limit tasks
  const filteredAndSortedTasks = useMemo(() => {
    return tasks

      .filter((task) => task.category !== "Class")
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
              color="#9CA3AF"
              className="mb-2"
            />
            <Text className="text-gray-500 font-quicksandSemiBold text-center">
              You haven't created any tasks yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

TasksSection.displayName = "TasksSection";

export default TasksSection;
