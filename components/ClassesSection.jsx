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

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-80 rounded-3xl mx-2 shadow-xl border overflow-hidden ${
        isDark
          ? "bg-gray-800/60 border-gray-700/30"
          : "bg-white/90 border-gray-200"
      }`}
      style={{
        backdropFilter: "blur(20px)",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
        elevation: 8,
      }}
    >
      {/* Header with gradient accent */}
      <View className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

      <View className="p-5">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 bg-indigo-500 rounded-full mr-2" />
              <Text
                className={`text-xl font-quicksandBold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>

            {/* Priority and Time Row */}
            <View className="flex-row items-center justify-between mb-3">
              <View
                className={`px-3 py-1.5 rounded-full border ${
                  item.priority === "High"
                    ? "bg-red-50 border-red-200"
                    : item.priority === "Medium"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-green-50 border-green-200"
                }`}
              >
                <Text
                  className={`text-sm font-quicksandSemiBold ${
                    item.priority === "High"
                      ? "text-red-700"
                      : item.priority === "Medium"
                        ? "text-amber-700"
                        : "text-green-700"
                  }`}
                >
                  {item.priority} Priority
                </Text>
              </View>

              <View className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full">
                <Text className="text-indigo-600 mr-1.5">🕐</Text>
                <Text
                  className={`text-sm font-quicksandSemiBold text-indigo-700`}
                >
                  {new Date(item.dueTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Class Icon */}
          <View className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg ml-3">
            <Text className="text-white text-xl">📚</Text>
          </View>
        </View>

        {/* Description Section */}
        {item.description && (
          <View
            className={`rounded-2xl p-4 ${
              isDark ? "bg-gray-700/30" : "bg-gray-50"
            }`}
          >
            <Text
              className={`text-sm font-quicksandMedium leading-relaxed ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
              numberOfLines={3}
            >
              {item.description}
            </Text>
          </View>
        )}

        {/* Bottom accent line */}
        <View className="h-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full mt-4" />
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
    <View className="my-4">
      <View className="flex-row justify-between items-center mb-4 px-2">
        <View className="flex-row items-center">
          <View className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
          <Text
            className={`text-xl font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Upcoming Classes
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigateSafely({
              pathname: "/(tabs)/AddTask",
              params: { category: "Class" },
            })
          }
          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl items-center justify-center shadow-md"
        >
          <Ionicons name="add" size={20} color="#fff" />
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
            paddingVertical: 40,
          }}
        >
          <View className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl items-center justify-center mb-4">
            <Ionicons name="school-outline" size={40} color="#6366F1" />
          </View>
          <Text
            className={`text-gray-500 font-quicksandMedium text-center text-lg mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            No classes scheduled this week.
          </Text>
          <Text
            className={`text-gray-400 font-quicksand text-center text-sm mb-6 ${
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
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-md flex-row items-center"
          >
            <Ionicons name="add" size={18} color="#fff" className="mr-2" />
            <Text className="text-white font-quicksandSemiBold font-semibold">
              Add A Class
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

ClassesSection.displayName = "ClassesSection";

export default ClassesSection;
