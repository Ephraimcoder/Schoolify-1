import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TasksContext } from "../context/TasksContext";

const TaskCard = React.memo(({ task, onPress }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { tasks, updateTask, deleteTask, getTaskById } =
    useContext(TasksContext);

  const [currentTask, setCurrentTask] = useState(task);

  if (!currentTask) return null;

  // Refresh task data when modal is opened
  const handleTaskDetails = useCallback(() => {
    // Use the task prop directly since we already have the latest data
    router.push({
      pathname: "/task-details/[id]",
      params: { id: task.id },
    });
    // setCurrentTask(task);
    // setIsModalVisible(true);
  }, [task.id]);

  const handleUpdateTask = (updatedFields) => {
    const updatedTask = { ...currentTask, ...updatedFields };
    updateTask(currentTask.id, updatedTask);
    setCurrentTask(updatedTask);
  };

  const handleSubtaskUpdate = (subtasks) => {
    handleUpdateTask({ subtasks });
  };

  const {
    category,
    priority,
    title,
    dueDate,
    dueTime,
    color = "bg-purple-500",
  } = task;

  // Format the date and time for display (memoized)
  const { formattedDate, formattedTime } = useMemo(
    () => ({
      formattedDate: dueDate
        ? new Date(dueDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "",
      formattedTime: dueTime
        ? new Date(dueTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }),
    [dueDate, dueTime]
  );

  // Priority colors
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
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleTaskDetails}
        className="bg-white rounded-2xl shadow-sm w-72 mr-4 p-4 border-l-4"
        style={{ borderLeftColor: color }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            {category && (
              <View className="self-start mb-2">
                <Text
                  className={`text-xs font-quicksandSemiBold px-2.5 py-1 rounded-full`}
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {category}
                </Text>
              </View>
            )}
          </View>

          {priority && (
            <View
              className={`px-2 py-1 rounded-full border ${getPriorityClasses()}`}
            >
              <Text className="text-xs font-quicksandBold uppercase tracking-wider">
                {priority}
              </Text>
            </View>
          )}
        </View>
        {/* Title container */}
        <View>
          <Text
            className="text-base font-quicksandBold text-gray-900 mb-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title?.length > 20 ? title?.slice(0, 20) + "..." : title}
          </Text>
        </View>
        {/* Date container */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 font-quicksandSemiBold ml-1.5">
              {formattedDate || "No date"}
            </Text>
          </View>
          {/* Time container */}
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 font-quicksandSemiBold ml-1.5">
              {formattedTime || "No time"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 p-5">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity
              onPress={handleEditTask}
              className="flex-row items-center p-2.5"
            >
              <Ionicons name="pencil" size={20} color="#4F46E5" />
              <Text className="ml-2 text-indigo-600 font-quicksandBold">
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteTask}
              className="flex-row items-center p-2.5"
            >
              <Ionicons name="trash" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-500 font-quicksandBold">
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="p-2.5"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TaskDetails
            task={currentTask}
            onUpdate={handleEditTask}
            onDelete={handleDeleteTask}
            onSubtaskUpdate={handleSubtaskUpdate}
          />
        </View>
      </Modal> */}
    </>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
