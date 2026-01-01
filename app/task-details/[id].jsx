import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TasksContext } from "../../context/TasksContext";
import {
  formatDate,
  formatTime,
  getCategoryStyle,
  getPriorityClasses,
} from "../../utils/taskUtils";
import { showError } from "../../utils/toast";

const TaskDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getTaskById, updateTask, deleteTask, addTask } =
    useContext(TasksContext);
  const [task, setTask] = useState(null);

  const taskData = useMemo(() => {
    return id ? getTaskById(id) : null;
  }, [id, getTaskById]);

  useEffect(() => {
    if (taskData) {
      setTask(taskData);
    } else if (id) {
      router.back();
    }
  }, [taskData, id, router]);

  const handleToggleComplete = () => {
    if (!task) return;

    const updatedTask = { ...task, isCompleted: !task.isCompleted };
    updateTask(task.id, updatedTask);
    setTask(updatedTask);
  };
  const handleEdit = () => {
    // Navigate to edit screen or open edit modal
    // For now, we'll just close the modal

    router.push({
      pathname: "/AddTask",
      params: { taskId: task.id },
    });
  };
  const handleDelete = () => {
    if (!task) return;

    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(task.id);
            router.back();
          } catch (error) {
            showError("Failed to delete task. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDuplicate = async () => {
    if (!task) return;

    try {
      // Create a new task with same data but new date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Navigate to edit screen with duplicated data as parameters
      router.push({
        pathname: "/AddTask",
        params: {
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          dueDate: tomorrow.toISOString(),
          dueTime: task.dueTime || new Date().toISOString(),
        },
      });
    } catch (error) {
      showError("Failed to duplicate task. Please try again.");
    }
  };

  const renderSubtask = ({ item, index }) => (
    <View
      key={`subtask-${index}`}
      className="flex-row items-center py-2 border-b border-gray-100"
    >
      <View className="w-5 h-5 rounded-full border border-gray-300 mr-3" />
      <Text className="text-gray-700 font-quicksandMedium flex-1">
        {item.title}
      </Text>
    </View>
  );

  const renderEmptySubtasks = () => (
    <View className="py-4 items-center justify-center">
      <Ionicons name="list-outline" size={32} color="#9CA3AF" />
      <Text className="text-gray-500 font-quicksandMedium mt-2">
        No subtasks added yet
      </Text>
    </View>
  );

  if (!task) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Loading task details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-quicksandBold text-gray-800">
            {task.category === "Class" ? "Class Details" : "Task Details"}
          </Text>
          <View className="flex-row">
            <TouchableOpacity onPress={handleEdit} className="p-2">
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDuplicate} className="p-2">
              <Ionicons name="copy-outline" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="p-2">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-5">
          {/* Header Section */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <View className="flex-row justify-between items-start mb-4">
              {task.category && (
                <View className="self-start mb-4">
                  <Text
                    className="text-xs font-quicksandSemiBold px-3 py-1.5 rounded-full"
                    style={getCategoryStyle(task.color)}
                  >
                    {task.category}
                  </Text>
                </View>
              )}
              {task.priority && (
                <View
                  className={`px-3 py-1.5 rounded-full border ${getPriorityClasses(task.priority)}`}
                >
                  <Text className="text-xs font-quicksandBold uppercase tracking-wider">
                    {task.priority}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-2xl font-quicksandBold text-gray-900 flex-1 mr-2">
              {task.title}
            </Text>

            {/* Description */}
            {task.description && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-gray-600 font-quicksandSemiBold mb-2">
                  Description
                </Text>
                <Text className="text-gray-700 text-base font-quicksandMedium leading-6">
                  {task.description}
                </Text>
              </View>
            )}
          </View>

          {/* Subtasks Section */}
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-quicksandBold text-gray-900">
                Subtasks
              </Text>
            </View>

            <FlatList
              data={task.subTasks || []}
              renderItem={renderSubtask}
              keyExtractor={(item, index) => `subtask-${index}`}
              ListEmptyComponent={renderEmptySubtasks}
              scrollEnabled={false}
            />
          </View>

          {/* Due Date & Time Section */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mt-6">
            <Text className="text-lg font-quicksandBold text-gray-900 mb-4">
              Due Date & Time
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text className="text-gray-600 font-quicksandSemiBold text-sm">
                  Due Date
                </Text>
                <Text className="text-gray-900 font-quicksandMedium">
                  {formatDate(task.dueDate)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text className="text-gray-600 font-quicksandSemiBold text-sm">
                  Time
                </Text>
                <Text className="text-gray-900 font-quicksandMedium">
                  {task.dueTime ? formatTime(task.dueTime) : "No time set"}
                </Text>
              </View>
            </View>
          </View>

          {/* Status */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-quicksandBold text-gray-900">
                Status
              </Text>
              <TouchableOpacity
                onPress={handleToggleComplete}
                className="px-4 py-2 rounded-lg bg-blue-50"
              >
                <Text className="text-blue-600 font-quicksandSemiBold">
                  {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Ionicons
                  name={task.isCompleted ? "checkmark-circle" : "time"}
                  size={20}
                  color={task.isCompleted ? "#10B981" : "#3B82F6"}
                />
              </View>
              <View>
                <Text className="text-gray-600 font-quicksandSemiBold text-sm">
                  Status
                </Text>
                <Text className="text-gray-900 font-quicksandMedium">
                  {task.isCompleted ? "Completed" : "In Progress"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TaskDetails;
