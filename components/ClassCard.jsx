import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, Animated, Text, TouchableOpacity, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";
import { showError, showSuccess } from "../utils/toast";

const ClassCard = React.memo(({ item }) => {
  const { deleteTask } = useContext(TasksContext);
  const { isDark } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleClassPress = useCallback(() => {
    router.push({
      pathname: "/task-details/[id]",
      params: { id: item.id },
    });
  }, [item.id]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent triggering class details when clicking delete
      Alert.alert(
        "Delete Class",
        "Are you sure you want to delete this class?",
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
                await deleteTask(item.id);
                showSuccess("Class deleted");
              } catch (e) {
                showError("Failed to delete class");
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [item.id, deleteTask],
  );

  const { title, description, dueDate, dueTime, priority } = item;

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
        return isDark
          ? "bg-red-900 border-red-800 text-red-200"
          : "bg-red-100 border-red-200 text-red-700";
      case "medium":
        return isDark
          ? "bg-amber-900 border-amber-800 text-amber-200"
          : "bg-amber-100 border-amber-200 text-amber-700";
      case "low":
        return isDark
          ? "bg-emerald-900 border-emerald-800 text-emerald-200"
          : "bg-emerald-100 border-emerald-200 text-emerald-700";
      default:
        return isDark
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleClassPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`w-72 rounded-2xl p-5 mx-2 shadow-sm border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <Text
                className={`text-sm font-quicksandSemiBold px-3 py-1.5 rounded-full mr-2 ${
                  isDark ? "text-blue-300" : "text-blue-600"
                }`}
              >
                Class
              </Text>
            </View>
            <Text
              className={`text-lg font-quicksandBold mb-3 ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
              numberOfLines={2}
            >
              {title}
            </Text>
            {description && (
              <Text
                className={`text-sm font-quicksand mb-3 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}
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

        <View
          className={`flex-row justify-between items-center mt-auto pt-3 border-t ${
            isDark ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <Text
            className={`text-sm font-quicksandSemiBold ml-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {formattedDate}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text
              className={`text-sm font-quicksandSemiBold ml-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
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
      </Animated.View>
    </TouchableOpacity>
  );
});

ClassCard.displayName = "ClassCard";

export default ClassCard;
