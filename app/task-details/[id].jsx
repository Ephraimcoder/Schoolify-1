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
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenAnimation from "../../components/ScreenAnimation";
import { TasksContext } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
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
  const { colors } = useTheme();
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

  const handleToggleSubtask = (subtaskId) => {
    if (!task) return;

    const updatedSubTasks = (task.subTasks || []).map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, isCompleted: !subtask.isCompleted }
        : subtask
    );

    const allDone =
      updatedSubTasks.length > 0 &&
      updatedSubTasks.every((subtask) => subtask.isCompleted);

    setTask((prev) => ({
      ...prev,
      subTasks: updatedSubTasks,
      isCompleted: allDone,
    }));

    updateTask(task.id, {
      subTasks: updatedSubTasks,
      isCompleted: allDone,
    });
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
    <TouchableOpacity
      key={`subtask-${index}`}
      onPress={() => handleToggleSubtask(item.id)}
      className="flex-row items-center py-2 mb-1 border-b"
      style={{ borderColor: colors.border }}
    >
      <View
        className="w-5 h-5 rounded-full border mr-3 items-center justify-center"
        style={{
          borderColor: item.isCompleted ? colors.primary : colors.border,
          backgroundColor: item.isCompleted
            ? colors.primary + "20"
            : "transparent",
        }}
      >
        {item.isCompleted && (
          <Ionicons name="checkmark" size={12} color={colors.primary} />
        )}
      </View>
      <Text
        className="font-quicksandMedium flex-1"
        style={{
          color: item.isCompleted ? colors.textSecondary : colors.text,
          textDecorationLine: item.isCompleted ? "line-through" : "none",
        }}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptySubtasks = () => (
    <View className="py-4 items-center justify-center">
      <Ionicons name="list-outline" size={32} color={colors.gray} />
      <Text
        className="font-quicksandMedium mt-2"
        style={{ color: colors.textSecondary }}
      >
        No subtasks added yet
      </Text>
    </View>
  );

  if (!task) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background[0] }}
      >
        <Text style={{ color: colors.textSecondary }}>
          Loading task details...
        </Text>
      </View>
    );
  }

  const totalSubtasks = task?.subTasks?.length || 0;
  const completedSubtasks =
    task?.subTasks?.filter((subtask) => subtask.isCompleted).length || 0;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  return (
    <ScreenAnimation duration={400}>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background[0] }}
      >
        {/* Header */}
        <View
          className="px-6 pt-14 pb-4 shadow-sm"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text
              className="text-xl font-quicksandBold"
              style={{ color: colors.text }}
            >
              {task.category === "Class" ? "Class Details" : "Task Details"}
            </Text>
            <View className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="p-2">
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDuplicate} className="p-2">
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color={colors.success}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="p-5">
            {/* Header Section */}
            <View
              className="rounded-2xl p-5 shadow-sm mb-6"
              style={{ backgroundColor: colors.card }}
            >
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
              <Text
                className="text-2xl font-quicksandBold flex-1 mr-2"
                style={{ color: colors.text }}
              >
                {task.title}
              </Text>

              {/* Description */}
              {task.description && (
                <View
                  className="mt-4 pt-4 rounded-2xl p-5"
                  style={{ borderTopColor: colors.border }}
                >
                  <Text
                    className="font-quicksandSemiBold mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Description
                  </Text>
                  <Text
                    className="text-base font-quicksandMedium leading-6"
                    style={{ color: colors.text }}
                  >
                    {task.description}
                  </Text>
                </View>
              )}
            </View>

            {/* Subtasks Section */}
            <View
              className="rounded-2xl p-5 shadow-sm"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="text-lg font-quicksandBold"
                  style={{ color: colors.text }}
                >
                  Subtasks
                </Text>
              </View>

              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className="text-xs font-quicksandSemiBold"
                    style={{ color: colors.textSecondary }}
                  >
                    {totalSubtasks > 0
                      ? `${completedSubtasks} of ${totalSubtasks} completed`
                      : "No subtasks yet"}
                  </Text>
                  {totalSubtasks > 0 && (
                    <Text
                      className="text-xs font-quicksandSemiBold"
                      style={{ color: colors.textSecondary }}
                    >
                      {Math.round(progress * 100)}%
                    </Text>
                  )}
                </View>

                {totalSubtasks > 0 && (
                  <View
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: colors.border }}
                  >
                    <View
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: colors.primary,
                        width: `${progress * 100}%`,
                      }}
                    />
                  </View>
                )}
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
            <View
              className="rounded-2xl p-5 shadow-sm mt-6"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-lg font-quicksandBold mb-4"
                style={{ color: colors.text }}
              >
                Due Date & Time
              </Text>

              <View className="flex-row items-center mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.secondary + "20" }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.secondary}
                  />
                </View>
                <View>
                  <Text
                    className="font-quicksandSemiBold text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Due Date
                  </Text>
                  <Text
                    className="font-quicksandMedium"
                    style={{ color: colors.text }}
                  >
                    {formatDate(task.dueDate)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.secondary + "20" }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.secondary}
                  />
                </View>
                <View>
                  <Text
                    className="font-quicksandSemiBold text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Time
                  </Text>
                  <Text
                    className="font-quicksandMedium"
                    style={{ color: colors.text }}
                  >
                    {task.dueTime ? formatTime(task.dueTime) : "No time set"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status */}
            <View
              className="rounded-2xl p-5 shadow-sm mt-6"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="text-lg font-quicksandBold"
                  style={{ color: colors.text }}
                >
                  Status
                </Text>
                <TouchableOpacity
                  onPress={handleToggleComplete}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <Text
                    className="font-quicksandSemiBold"
                    style={{ color: colors.primary }}
                  >
                    {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <Ionicons
                    name={task.isCompleted ? "checkmark-circle" : "time"}
                    size={20}
                    color={task.isCompleted ? colors.success : colors.primary}
                  />
                </View>
                <View>
                  <Text
                    className="font-quicksandSemiBold text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Status
                  </Text>
                  <Text
                    className="font-quicksandMedium"
                    style={{ color: colors.text }}
                  >
                    {task.isCompleted ? "Completed" : "In Progress"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenAnimation>
  );
};

export default TaskDetails;
