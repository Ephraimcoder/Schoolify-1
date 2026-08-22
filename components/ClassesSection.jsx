import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useContext, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TasksContext } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const ClassCard = ({ item, onPress }) => {
  const { isDark } = useTheme();

  const priorityColors = {
    High: isDark ? "bg-red-500" : "bg-red-500",
    Medium: isDark ? "bg-amber-500" : "bg-amber-500",
    Low: isDark ? "bg-green-500" : "bg-green-500",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-80 rounded-2xl mx-2 shadow-md border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
      style={{ elevation: 4 }}
    >
      <View className="p-4">
        {/* Title row with icon and priority dot */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Text className="text-lg">📚</Text>
            </View>
            <View className="flex-1">
              <Text
                className={`text-lg font-quicksandBold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
          </View>
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              priorityColors[item.priority] || priorityColors.Low
            }`}
          />
        </View>

        {/* Date and time row */}
        <View className="flex-row items-center mb-3">
          <Ionicons
            name="calendar-outline"
            size={16}
            color={isDark ? "#9CA3AF" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {new Date(item.dueDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <View
            className={`w-1 h-1 rounded-full mx-2 ${
              isDark ? "bg-gray-600" : "bg-gray-300"
            }`}
          />
          <Ionicons
            name="time-outline"
            size={16}
            color={isDark ? "#9CA3AF" : "#6B7280"}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {new Date(item.dueTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Description (if exists) */}
        {item.description && (
          <Text
            className={`text-sm font-quicksandMedium leading-relaxed ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ClassesSection = () => {
  const { tasks, isLoading } = useContext(TasksContext);
  const { isDark, colors } = useTheme();
  const router = useRouter();

  // Safe navigation function
  const navigateSafely = useCallback(
    (pathOrParams) => {
      try {
        if (router && router.push) {
          router.push(pathOrParams);
        }
      } catch (error) {
        console.warn("Navigation error:", error);
      }
    },
    [router],
  );

  // Filter and memoize class tasks for the NEXT WEEK
  const classTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    oneWeekFromNow.setHours(23, 59, 59, 999); // Set to end of day

    return tasks
      .filter((task) => {
        // Only show incomplete classes that are scheduled within the next week
        if (task.category !== "Class") return false;
        if (task.isCompleted) return false;
        if (!task.dueTime) return false;

        const classDate = new Date(task.dueTime);
        return classDate >= today && classDate <= oneWeekFromNow;
      })
      .sort((a, b) => {
        // Sort by schedule time (earliest first)
        const dateA = new Date(a.dueTime);
        const dateB = new Date(b.dueTime);
        return dateA.getTime() - dateB.getTime();
      });
  }, [tasks]);

  const handleClassPress = (classTask) => {
    navigateSafely(`/task-details/${classTask.id}`);
  };

  if (isLoading) {
    return (
      <View className="my-4 px-2">
        <View className="flex-row justify-between items-center mb-3">
          <Text
            className={`text-lg font-quicksandBold ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Upcoming Classes
          </Text>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-quicksandSemiBold">
              See All
            </Text>
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="my-3">
      <View className="flex-row justify-between items-center mb-3 px-2">
        <View className="flex-row items-center">
          <View className="w-1 h-5 bg-purple-500 rounded-full mr-2" />
          <Text
            className={`text-lg font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Upcoming Classes
          </Text>
          <View className="ml-2 px-2 py-1 bg-purple-100 rounded-full">
            <Text className="text-xs font-quicksandSemiBold text-purple-700">
              {classTasks.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigateSafely({
              pathname: "/(tabs)/AddTask",
              params: { category: "Class" },
            })
          }
          className={`w-8 h-8 rounded-xl items-center justify-center shadow-sm ${
            isDark
              ? "bg-gradient-to-br from-purple-500 to-indigo-500"
              : "bg-gradient-to-br from-purple-600 to-indigo-600"
          }`}
        >
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {classTasks.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {classTasks.slice(0, 5).map((task) => (
            <ClassCard
              key={task.id}
              item={task}
              onPress={() => handleClassPress(task)}
            />
          ))}
        </ScrollView>
      ) : (
        <View
          style={{
            width: width - 32,
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 32,
          }}
        >
          <View className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl items-center justify-center mb-3">
            <Ionicons name="school-outline" size={32} color="#6366F1" />
          </View>
          <Text
            className={`font-quicksandMedium text-center text-base mb-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            No classes scheduled
          </Text>
          <Text
            className={`font-quicksand text-center text-sm mb-4 ${
              isDark ? "text-gray-500" : "text-gray-500"
            }`}
          >
            Add your first class to get started!
          </Text>
          <TouchableOpacity
            onPress={() =>
              navigateSafely({
                pathname: "/(tabs)/AddTask",
                params: { category: "Class" },
              })
            }
            className={`px-4 py-2 rounded-xl shadow-sm flex-row items-center ${
              isDark
                ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                : "bg-gradient-to-r from-purple-600 to-indigo-600"
            }`}
          >
            <Ionicons name="add" size={16} color="#fff" className="mr-1" />
            <Text className="text-white font-quicksandSemiBold text-sm">
              Add Class
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

ClassesSection.displayName = "ClassesSection";

export default ClassesSection;
