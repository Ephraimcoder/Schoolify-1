import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import { showError, showSuccess } from "../utils/toast";

const TaskCard = React.memo(({ task }) => {
  const { deleteTask } = useContext(TasksContext);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTaskPress = useCallback(() => {
    router.push({
      pathname: "/task-details/[id]",
      params: { id: task.id },
    });
  }, [task.id]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent triggering task details when clicking delete
      Alert.alert(
        "Delete Task",
        "Are you sure you want to delete this task?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setIsDeleting(true);
                await deleteTask(task.id);
                showSuccess("Task deleted");
              } catch (e) {
                showError("Failed to delete task");
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [task.id, deleteTask]
  );

  const {
    category,
    priority,
    title,
    dueDate,
    dueTime,
    color = "bg-purple-500",
  } = task;

  // Format date and time
  const formattedDate = useMemo(() => {
    if (!dueDate) return "No date";
    return new Date(dueDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [dueDate]);

  const formattedTime = useMemo(() => {
    if (!dueTime) return "--:--";
    return new Date(dueTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dueTime]);

  const getPriorityClasses = () => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 border-red-200 text-red-700";
      case "medium":
        return "bg-amber-100 border-amber-200 text-amber-700";
      case "low":
        return "bg-emerald-100 border-emerald-200 text-emerald-700";
      default:
        return "bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleTaskPress}
      className="w-72 bg-white rounded-2xl p-5 mx-2 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          {category && (
            <Text
              className="text-xs font-quicksandSemiBold px-3 py-1.5 rounded-full self-start mb-3"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {category}
            </Text>
          )}
          <Text
            className="text-lg font-quicksandBold text-gray-800 mb-3"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className="p-1.5 -mr-1.5 -mt-1.5"
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={isDeleting ? "#9CA3AF" : "#EF4444"}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center mt-auto pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 font-quicksandSemiBold ml-2">
            {formattedDate}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 font-quicksandSemiBold ml-2">
            {formattedTime}
          </Text>
        </View>
        {priority && (
          <View
            className={`px-3 py-1 rounded-full border ${getPriorityClasses()}`}
          >
            <Text className="text-xs font-quicksandBold uppercase">
              {priority}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
