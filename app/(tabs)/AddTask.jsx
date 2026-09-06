import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import ScreenAnimation from "../../components/ScreenAnimation";
import SelectableButton from "../../components/SelectableButton";
import SubtaskModal from "../../components/SubtaskModal";
import {
  useCategories,
  useForm,
  usePriorities,
  useTaskActions,
  useTasks,
} from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
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
  const { getTaskById } = useTasks();
  const { isDark, colors } = useTheme();
  const {
    formData,
    setFormData,
    resetForm,
    subTasks,
    setSubTasks,
    addSubTask,
    deleteSubTask,
  } = useForm();
  const { categories, addCategory, deleteCategory } = useCategories();
  const { priorities, addPriority, deletePriority } = usePriorities();
  const { handleAddTask, updateTask } = useTaskActions();

  const [selectedCategory, setSelectedCategory] = useState("Design");
  const [selectedPriority, setSelectedPriority] = useState("Low");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [isSubtaskModalVisible, setIsSubtaskModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [modalType, setModalType] = useState(""); // 'category' or 'priority'
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(true);
  const router = useRouter();
  const {
    taskId,
    category: prefillCategory,
    title,
    description,
    priority,
    dueDate,
    dueTime,
  } = useLocalSearchParams();

  const scheduleTaskNotification = useCallback(
    async ({ id, title, description, dueDate, dueTime, isClass = false }) => {
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

      // If 0, schedule at due time; otherwise subtract lead time
      const triggerTime =
        leadMinutes === 0
          ? dueDateTime
          : new Date(dueDateTime.getTime() - leadMinutes * 60000);

      // Don't schedule in the past
      if (!triggerTime || triggerTime <= new Date()) {
        toast.error("Skipping past notification time");
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
          toast.error("Notification permissions not granted");
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
            enableLights: true,
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        }

        // Cancel any existing notification with this ID
        await Notifications.cancelScheduledNotificationAsync(id);

        // Customize notification content based on whether it's a class or task
        const notificationTitle = isClass
          ? `📚 Your class ${title} is starting soon!`
          : `🔔 Your Task ${title} is due soon`;

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
              isClass,
            },
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 300, 200, 300],
          },
          trigger: {
            type: "date",
            date: triggerTime,
          },
        });

        return id;
      } catch (error) {
        toast.error("Failed to set reminder");
        return null;
      }
    },
    [alertEnabled],
  );

  // Add notification handler for when app is in foreground - defer to background
  useEffect(() => {
    let subscription = null;
    let timeoutId = setTimeout(() => {
      subscription = Notifications.addNotificationReceivedListener(
        (notification) => {},
      );

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }, 200); // Defer notification setup to not block initial render

    return () => {
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.remove();
      }
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
            // Disable quick mode when editing to preserve all fields
            setIsQuickMode(false);

            // Set all fields explicitly from the task, avoiding stale spreads
            setFormData({
              title: taskToEdit.title || "",
              description: taskToEdit.description || "",
              category: taskToEdit.category || "",
              priority: taskToEdit.priority || "Low",
              dueDate: taskToEdit.dueDate || new Date().toISOString(),
              dueTime: taskToEdit.dueTime || new Date().toISOString(),
              isCompleted: !!taskToEdit.isCompleted,
              alertEnabled: true,
            });
            setSelectedCategory(taskToEdit.category || "");
            setSelectedPriority(taskToEdit.priority || "Low");
            setSubTasks(taskToEdit.subTasks || []);
            setAlertEnabled(true);
          }
        } else {
          // Creating a new task - enable quick mode by default
          setIsQuickMode(true);
          resetForm();

          // Check if this is a duplicate task with pre-filled data
          if (title || description || dueDate) {
            setFormData({
              title: title || "",
              description: description || "",
              category: prefillCategory || "",
              priority: priority || "Low",
              dueDate: dueDate || new Date().toISOString(),
              dueTime: dueTime || new Date().toISOString(),
              isCompleted: false,
              alertEnabled: true,
            });
            setSelectedCategory(prefillCategory || "");
            setSelectedPriority(priority || "Low");
          } else {
            // Regular new task
            setSelectedCategory(prefillCategory || "");
            // If a prefill category is provided via route params, set it in formData
            if (prefillCategory) {
              setFormData((prev) => ({
                ...prev,
                category: prefillCategory,
              }));
            }
            setSelectedPriority("Low");
          }
          setSubTasks([]);
          setAlertEnabled(true);
        }
      });

      return () => {
        cancelled = true;
        interaction.cancel();
      };
    }, [
      taskId,
      getTaskById,
      prefillCategory,
      title,
      description,
      priority,
      dueDate,
      dueTime,
    ]),
  );

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAddSubtask = useCallback(
    (title) => {
      addSubTask(title);
    },
    [addSubTask],
  );

  const handleDeleteSubtask = useCallback(
    (index) => {
      deleteSubTask(index);
    },
    [deleteSubTask],
  );

  const handleOpenModal = useCallback((type) => {
    setModalType(type);
    setIsItemModalVisible(true);
  }, []);

  const handleAddItem = useCallback(
    (name) => {
      if (modalType === "category") {
        addCategory(name);
      } else {
        addPriority(name);
      }
    },
    [modalType, addCategory, addPriority],
  );

  const handleDeleteItem = useCallback(
    (id) => {
      if (modalType === "category") {
        deleteCategory(id);
      } else {
        deletePriority(id);
      }
    },
    [modalType, deleteCategory, deletePriority],
  );

  const handleQuickSave = useCallback(async () => {
    const { title, dueDate, dueTime } = formData;

    // Validate only title and date/time for quick mode
    if (!title.trim() || !dueDate || !dueTime) {
      toast.error("Please enter a title and select date/time", {
        styles: {
          view: { padding: 20, margin: 10 },
          text: { fontSize: 16, color: "red", fontFamily: "QuicksandBold" },
        },
      });
      return;
    }

    // Set default values for quick mode
    const taskData = {
      ...formData,
      description: "",
      category: formData.category === "Class" ? "Class" : "Personal",
      priority: "Low",
      subTasks: [],
      alertEnabled,
    };

    let notificationId = null;

    if (alertEnabled) {
      notificationId = await scheduleTaskNotification({
        id: taskId || `task-${Date.now()}`,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        isClass: false,
      });
    }

    const finalTaskData = {
      ...taskData,
      notificationId,
    };

    try {
      setIsSaving(true);
      await handleAddTask(finalTaskData);

      router.setParams({
        taskId: undefined,
        category: undefined,
        title: undefined,
        description: undefined,
        priority: undefined,
        dueDate: undefined,
        dueTime: undefined,
      });
      resetForm();
      setSubTasks([]);
      setSelectedCategory("");
      setSelectedPriority("Low");
      setAlertEnabled(true);
      router.back();

      toast.success("Quick task saved successfully!");
    } catch (error) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    formData,
    alertEnabled,
    taskId,
    scheduleTaskNotification,
    handleAddTask,
    resetForm,
    router,
  ]);

  const handleSubmit = useCallback(async () => {
    const { title, description, category, priority, dueDate, dueTime } =
      formData;

    // Validate required fields for full mode - description is optional
    if (!title.trim() || !category || !priority || !dueDate || !dueTime) {
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
      notificationId,
    };

    try {
      setIsSaving(true);

      if (taskId) {
        await updateTask(taskId, taskData);
      } else {
        await handleAddTask(taskData);
      }

      // Clear form and navigate back
      router.setParams({
        taskId: undefined,
        category: undefined,
        title: undefined,
        description: undefined,
        priority: undefined,
        dueDate: undefined,
        dueTime: undefined,
      });
      resetForm();
      setSubTasks([]);
      setSelectedCategory("");
      setSelectedPriority("Low");
      setAlertEnabled(true);
      router.back();

      const isClass = formData.category === "Class";
      const isEditing = !!taskId;

      toast.success(
        isClass
          ? isEditing
            ? "Class updated successfully!"
            : "Class created successfully!"
          : "Task saved successfully!",
        {
          width: 400,
          duration: 4000,
          styles: {
            view: { padding: 20 },
            text: { fontSize: 16, color: "green", fontFamily: "QuicksandBold" },
          },
        },
      );
    } catch (error) {
      toast.error("Failed to save. Please try again.", {
        styles: {
          view: { padding: 20, margin: 10 },
          text: { fontSize: 16, color: "red", fontFamily: "QuicksandBold" },
        },
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    formData,
    subTasks,
    alertEnabled,
    taskId,
    scheduleTaskNotification,
    updateTask,
    handleAddTask,
    resetForm,
    router,
  ]);

  return (
    <ScreenAnimation duration={400}>
      <LinearGradient colors={colors.background} className="flex-1">
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
                className={`p-2 rounded-full ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
                onPress={() => {
                  router.setParams({
                    taskId: undefined,
                    category: undefined,
                    title: undefined,
                    description: undefined,
                    priority: undefined,
                    dueDate: undefined,
                    dueTime: undefined,
                  });
                  resetForm();
                  setSubTasks([]);
                  setSelectedCategory("");
                  setSelectedPriority("Low");
                  setAlertEnabled(true);
                  router.back();
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              </TouchableOpacity>
              <Text
                className={`text-2xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {taskId
                  ? formData.category === "Class"
                    ? "Edit Class"
                    : "Edit Task"
                  : formData.category === "Class"
                    ? "New Class"
                    : "New Task"}
              </Text>
              <View className="w-10" />
            </View>

            {/* Quick Mode Toggle - Hide when editing */}
            {!taskId && (
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-base font-quicksandBold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Quick Mode
                </Text>
                <Switch
                  trackColor={{
                    false: isDark ? "#374151" : "#E5E7EB",
                    true: isDark ? "#6366F1" : "#A5B4FC",
                  }}
                  thumbColor={isQuickMode ? "#4F46E5" : "#F3F4F6"}
                  onValueChange={setIsQuickMode}
                  value={isQuickMode}
                />
              </View>
            )}

            {/* Form */}
            <FormInput
              placeholder={
                formData.category === "Class" ? "Class Name" : "Task Title"
              }
              onChangeText={(text) => handleInputChange("title", text)}
              value={formData.title}
              label={formData.category === "Class" ? "Class Name" : "Title"}
            />

            {/* Description - Only show in Full Mode */}
            {!isQuickMode && (
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
                className={`border rounded-xl p-4 h-28 text-base font-quicksand my-2 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-100"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
                textAlignVertical="top"
              />
            )}

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

            {/* Category - Hide when creating a class or in Quick Mode */}
            {!isQuickMode && formData.category !== "Class" && (
              <>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-lg font-quicksandBold my-2 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Course / Category
                  </Text>
                  <TouchableOpacity
                    className={`p-2 rounded ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
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
                          formData.category === category.name
                            ? ""
                            : category.name,
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
              </>
            )}

            {/* Priority - Only show in Full Mode */}
            {!isQuickMode && (
              <>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-lg font-quicksandBold my-2 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Priority
                  </Text>
                  <TouchableOpacity
                    className={`p-2 rounded ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
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
                          formData.priority === priority.name
                            ? ""
                            : priority.name,
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
              </>
            )}

            {/* Alert - Only show in Full Mode */}
            {!isQuickMode && (
              <>
                <View className="flex-row justify-between items-center my-6">
                  <Text
                    className={`text-lg font-quicksandBold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {formData.category === "Class"
                      ? "Get alert for this class"
                      : "Get alert for this task"}
                  </Text>
                  <Switch
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: isDark ? "#6366F1" : "#FCA5A5",
                    }}
                    thumbColor={
                      alertEnabled
                        ? isDark
                          ? "#8B5CF6"
                          : "#EF4444"
                        : isDark
                          ? "#1F2937"
                          : "#f4f3f4"
                    }
                    onValueChange={(value) => {
                      setAlertEnabled(value);
                      handleInputChange("alertEnabled", value);
                    }}
                    value={alertEnabled}
                  />
                </View>

                {/* Add Subtask Button */}
                <View className="mb-6">
                  <Text
                    className={`text-base font-quicksandBold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    Subtasks {subTasks.length > 0 && `(${subTasks.length})`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsSubtaskModalVisible(true)}
                    className={`flex-row items-center justify-center border-2 border-dashed rounded-xl py-3 ${
                      isDark ? "border-indigo-800" : "border-indigo-200"
                    }`}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="#4F46E5"
                    />
                    <Text className="text-indigo-600 font-quicksandBold ml-2">
                      {subTasks.length > 0 ? "Edit Subtasks" : "Add Subtasks"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Create Button - Different based on mode */}
            <TouchableOpacity
              className={`py-4 rounded-xl my-6 ${isSaving ? "opacity-70" : ""} ${
                isQuickMode && !taskId
                  ? isDark
                    ? "bg-green-600"
                    : "bg-green-500"
                  : isDark
                    ? "bg-indigo-600"
                    : "bg-[#F26D6D]"
              }`}
              onPress={isQuickMode && !taskId ? handleQuickSave : handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white text-center font-quicksandBold text-lg ml-2">
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center font-quicksandBold text-lg">
                  {isQuickMode && !taskId
                    ? "Quick Add"
                    : formData.category === "Class"
                      ? taskId
                        ? "Edit Class"
                        : "Create Class"
                      : taskId
                        ? "Edit Task"
                        : "Create Task"}
                </Text>
              )}
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
    </ScreenAnimation>
  );
};

export default AddTask;
