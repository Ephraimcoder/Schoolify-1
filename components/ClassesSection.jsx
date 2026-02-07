import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useMemo } from "react";
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
      className={`w-72 rounded-2xl p-5 mx-2 shadow-sm border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text
            className={`text-base font-quicksandBold mb-2 ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className={`text-sm font-quicksandSemiBold mb-1 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {item.priority} Priority
          </Text>
          <Text
            className={`text-sm font-quicksandMedium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {new Date(item.dueTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View className="w-3 h-3 rounded-full bg-indigo-500" />
      </View>
      {item.description && (
        <View className="flex-row items-center">
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
          <Text
            className={`text-xs ml-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ClassesSection = () => {
  const { tasks, isLoading } = useContext(TasksContext);
  const { isDark, colors } = useTheme();
  const router = useRouter();

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
    router.push(`/task-details/${classTask.id}`);
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
      <View className="flex-row justify-between items-center mb-3 px-2">
        <Text
          className={`text-lg font-quicksandBold ${
            isDark ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Upcoming Classes
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/AddTask",
              params: { category: "Class" },
            })
          }
          className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={20} color="#4F46E5" />
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
          <Ionicons
            name="school-outline"
            size={56}
            color="#9CA3AF"
            style={{ marginBottom: 12, opacity: 0.7 }}
          />
          <Text
            className={`text-gray-500 font-quicksandMedium text-center text-base ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No classes scheduled this week.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/AddTask",
                params: { category: "Class" },
              })
            }
            className="mt-4 px-6 py-2 bg-indigo-100 rounded-full"
          >
            <Text className="text-indigo-600 font-quicksandSemiBold">
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
