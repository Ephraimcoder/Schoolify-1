import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  InteractionManager,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerButton from "../../components/DateTimePickerButton";
import FormInput from "../../components/FormInput";
import ItemManagementModal from "../../components/ItemManagementModal";
import SelectableButton from "../../components/SelectableButton";
import SubtaskModal from "../../components/SubtaskModal";
import { TasksContext } from "../../context/TasksContext";
import { getNotificationLeadMinutes } from "../../utils/notificationPrefs";

const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const AddTask = () => {
  const {
    tasks,
    formData,
    setFormData,
    categories,
    priorities,
    handleAddTask,
    resetForm,
    subTasks,
    setSubTasks,
    addSubTask,
    deleteSubTask,
    getTaskById,
    updateTask,
    addCategory,
    deleteCategory,
    addPriority,
    deletePriority,
  } = useContext(TasksContext);

  const [selectedCategory, setSelectedCategory] = useState("Design");
  const [selectedPriority, setSelectedPriority] = useState("Low");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [isSubtaskModalVisible, setIsSubtaskModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [modalType, setModalType] = useState(""); // 'category' or 'priority'
  const router = useRouter();
  const { taskId } = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Notifications.getPermissionsAsync().then(({ status }) => {
        if (status !== "granted") {
          Notifications.requestPermissionsAsync().catch(() => {});
        }
      });
    });
    return () => interaction.cancel();
  }, [fadeAnim]);

  const scheduleTaskNotification = async ({
    id,
    title,
    description,
    dueDate,
    dueTime,
    isClass = false, // Add isClass parameter with default false
  }) => {
    // Allow notifications for classes even if alert toggle is off
    if (!alertEnabled && !isClass) return;

    // Combine date and time into a single Date object
    const dueDateTime = new Date(dueDate);
    if (dueTime) {
      const time = new Date(dueTime);
      dueDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }

    // Apply user's preferred lead time (minutes before)
    const leadMinutes = await getNotificationLeadMinutes();
    const triggerTime = new Date(dueDateTime.getTime() - leadMinutes * 60000);

    // Don't schedule in the past
    if (!triggerTime || triggerTime <= new Date()) {
      console.log("Skipping past notification time");
      return null;
    }

    try {
      // Request permissions if not already granted
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permissions not granted");
        return null;
      }

      // Set up notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      }

      // Cancel any existing notification with this ID
      await Notifications.cancelScheduledNotificationAsync(id);

      // Customize notification content based on whether it's a class or task
      const notificationTitle = isClass
        ? `📚 Your class ${title} is starting soon!`
        : `🔔 Your Task ${title} id due soon`;

      const notificationBody = isClass
        ? `Your class is about to begin. Don't be late!`
        : `Don't forget to complete your task!`;

      // Schedule the notification using the adjusted trigger time
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            id,
            title,
            type: isClass ? "class" : "task",
            isClass, // Include isClass in the notification data
          },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          type: "date",
          date: triggerTime,
        },
      });

      console.log(
        `Notification scheduled for ${triggerTime.toISOString()} (lead ${leadMinutes}m before ${dueDateTime.toISOString()})`
      );
      return id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      toast.error("Failed to set reminder");
      return null;
    }
  };

  // Add notification handler for when app is in foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const interaction = InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        if (taskId) {
          const taskToEdit = getTaskById(taskId);
          if (taskToEdit) {
            // Set all fields explicitly from the task, avoiding stale spreads
            setFormData({
              title: taskToEdit.title || "",
              description: taskToEdit.description || "",
              category: taskToEdit.category || "",
              priority: taskToEdit.priority || "Low",
              dueDate: taskToEdit.dueDate || new Date().toISOString(),
              dueTime: taskToEdit.dueTime || new Date().toISOString(),
              isCompleted: !!taskToEdit.isCompleted,
              alertEnabled: false,
            });
            setSelectedCategory(taskToEdit.category || "");
            setSelectedPriority(taskToEdit.priority || "Low");
            setSubTasks(taskToEdit.subTasks || []);
            setAlertEnabled(false);
          }
        } else {
          // Creating a new task
          resetForm();
          setSelectedCategory("");
          setSelectedPriority("Low");
          setSubTasks([]);
          setAlertEnabled(false);
        }
      });

      return () => {
        cancelled = true;
        interaction.cancel();
      };
    }, [taskId, getTaskById])
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const { title, description, category, priority, dueDate, dueTime } =
      formData;

    // Validate required fields
    if (
      !title.trim() ||
      !description.trim() ||
      !category ||
      !priority ||
      !dueDate ||
      !dueTime
    ) {
      toast.error("Please fill in all required fields", {
        styles: {
          view: { padding: 20, margin: 10 },
          text: { fontSize: 16, color: "red", fontFamily: "QuicksandBold" },
        },
      });
      return;
    }

    let notificationId = null;

    if (alertEnabled || formData.category === "Class") {
      notificationId = await scheduleTaskNotification({
        id: taskId || `task-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        isClass: formData.category === "Class",
      });
    }

    // Save the task with notification ID (if scheduled)
    const taskData = {
      ...formData,
      subTasks,
      alertEnabled,
      // notificationId,
    };

    try {
      if (taskId) {
        await updateTask(taskId, taskData);
      } else {
        await handleAddTask(taskData);
      }

      // Clear form and navigate back
      router.setParams({ taskId: undefined });
      resetForm();
      setSubTasks([]);
      setSelectedCategory("");
      setSelectedPriority("Low");
      setAlertEnabled(false);
      router.back();

      toast.success("Task saved successfully!", {
        width: 400,
        duration: 4000,
        styles: {
          view: { padding: 20 },
          text: { fontSize: 16, color: "green", fontFamily: "QuicksandBold" },
        },
      });
    } catch (error) {
      console.error("❌ Error saving task:", error);
      toast.error("Failed to save task. Please try again.", {
        styles: {
          view: { padding: 20, margin: 10 },
          text: { fontSize: 16, color: "red", fontFamily: "QuicksandBold" },
        },
      });
    }
  };

  const handleAddSubtask = (title) => {
    addSubTask(title);
  };

  const handleDeleteSubtask = (index) => {
    deleteSubTask(index);
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsItemModalVisible(true);
  };

  const handleAddItem = (name) => {
    if (modalType === "category") {
      addCategory(name);
    } else {
      addPriority(name);
    }
  };

  const handleDeleteItem = (id) => {
    if (modalType === "category") {
      deleteCategory(id);
    } else {
      deletePriority(id);
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={["#FFFBF5", "#FEFBF6"]} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView
            className="px-6 pt-4"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity
                className="bg-white p-2 rounded-full"
                onPress={() => {
                  router.setParams({ taskId: undefined });
                  resetForm();
                  setSubTasks([]);
                  setSelectedCategory("");
                  setSelectedPriority("Low");
                  setAlertEnabled(false);
                  router.back();
                }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-quicksandBold">
                {taskId ? "Edit Task" : "New Task"}
              </Text>
              <View className="w-10" />
            </View>

            {/* Form */}
            <FormInput
              placeholder={
                formData.category === "Class" ? "Class Name" : "Task Title"
              }
              onChangeText={(text) => handleInputChange("title", text)}
              value={formData.title}
              label={formData.category === "Class" ? "Class Name" : "Title"}
            />

            <TextInput
              placeholder={
                formData.category === "Class"
                  ? "Add class description and important notes"
                  : "Add your task details"
              }
              placeholderTextColor="#A0A0A0"
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline
              className="bg-white border border-gray-200 rounded-xl p-4 h-28 text-base font-quicksand my-2"
              textAlignVertical="top"
            />

            {/* Date and Time Picker */}
            <View className="flex-row justify-between my-4">
              <DateTimePickerButton
                value={new Date(formData.dueDate)}
                onValueChange={(date) =>
                  handleInputChange("dueDate", date.toISOString())
                }
                mode="date"
                label={
                  formData.category === "Class" ? "Class Date" : "Due Date"
                }
                minimumDate={new Date()}
              />

              <DateTimePickerButton
                value={new Date(formData.dueTime)}
                onValueChange={(time) =>
                  handleInputChange("dueTime", time.toISOString())
                }
                mode="time"
                label={
                  formData.category === "Class" ? "Class Time" : "Due Time"
                }
                is24Hour={false}
              />
            </View>

            {/* Category */}
            <View className="flex-row items-center">
              <Text className="text-lg font-quicksandBold my-2">
                Course / Category
              </Text>
              <TouchableOpacity
                className="ml-2 p-2 bg-gray-100 rounded"
                onPress={() => handleOpenModal("category")}
              >
                <Ionicons name="pencil" size={14} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <SelectableButton
                  key={category.id}
                  label={category.name}
                  isSelected={formData.category === category.name}
                  onPress={() => {
                    handleInputChange(
                      "category",
                      formData.category === category.name ? "" : category.name
                    );
                  }}
                  selectedBgColor="bg-blue-500"
                  selectedTextColor="text-white"
                  unselectedBgColor="bg-white"
                  unselectedTextColor="text-gray-700"
                  borderColor="border-gray-200"
                />
              ))}
            </View>

            {/* Priority */}
            <View className="flex-row items-center">
              <Text className="text-lg font-quicksandBold my-2">Priority</Text>
              <TouchableOpacity
                className="ml-2 p-2 bg-gray-100 rounded"
                onPress={() => handleOpenModal("priority")}
              >
                <Ionicons name="pencil" size={14} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {priorities.map((priority) => (
                <SelectableButton
                  key={priority.id}
                  label={priority.name}
                  isSelected={formData.priority === priority.name}
                  onPress={() => {
                    handleInputChange(
                      "priority",
                      formData.priority === priority.name ? "" : priority.name
                    );
                  }}
                  selectedBgColor={
                    priority.name.toLowerCase() === "high"
                      ? "bg-red-500"
                      : priority.name.toLowerCase() === "medium"
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }
                  selectedTextColor="text-white"
                  unselectedBgColor="bg-white"
                  unselectedTextColor="text-gray-700"
                  borderColor="border-gray-200"
                />
              ))}
            </View>

            {/* Alert */}
            <View className="flex-row justify-between items-center my-6">
              <Text className="text-lg font-quicksandBold">
                {formData.category === "Class"
                  ? "Get alert for this class"
                  : "Get alert for this task"}
              </Text>
              <Switch
                trackColor={{ false: "#E5E7EB", true: "#FCA5A5" }}
                thumbColor={alertEnabled ? "#EF4444" : "#f4f3f4"}
                onValueChange={(value) => {
                  setAlertEnabled(value);
                  handleInputChange("alertEnabled", value);
                }}
                value={alertEnabled}
              />
            </View>

            {/* Add Subtask Button */}
            <View className="mb-6">
              <Text className="text-base font-quicksandBold text-gray-800 mb-2">
                Subtasks {subTasks.length > 0 && `(${subTasks.length})`}
              </Text>
              <TouchableOpacity
                onPress={() => setIsSubtaskModalVisible(true)}
                className="flex-row items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl py-3"
              >
                <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
                <Text className="text-indigo-600 font-quicksandBold ml-2">
                  {subTasks.length > 0 ? "Edit Subtasks" : "Add Subtasks"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              className="bg-[#F26D6D] py-4 rounded-xl my-6"
              onPress={handleSubmit}
            >
              <Text className="text-white text-center font-quicksandBold text-lg">
                {taskId ? "Edit Task" : "Create Task"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Subtask Modal */}
          <SubtaskModal
            visible={isSubtaskModalVisible}
            onClose={() => setIsSubtaskModalVisible(false)}
            subtasks={subTasks}
            onAddSubtask={handleAddSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
          <ItemManagementModal
            visible={isItemModalVisible}
            onClose={() => setIsItemModalVisible(false)}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            type={modalType}
            items={modalType === "category" ? categories : priorities}
          />
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
};

export default AddTask;
