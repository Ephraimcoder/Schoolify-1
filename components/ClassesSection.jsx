import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TasksContext } from "../context/TasksContext";

const ClassCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-72 bg-white rounded-2xl p-5 mx-2 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text
            className="text-base font-quicksandBold text-gray-800 mb-2"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-sm text-gray-600 font-quicksandSemiBold mb-1">
            {item.priority} Priority
          </Text>
          <Text className="text-xs text-gray-500 mb-2">
            {new Date(item.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            •{" "}
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
          <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ClassesSection = React.memo(() => {
  const { tasks, isLoading } = useContext(TasksContext);
  const router = useRouter();

  // Filter and memoize class tasks
  const classTasks = useMemo(() => {
    return tasks.filter((task) => task.category === "Class");
  }, [tasks]);

  const handleClassPress = (classTask) => {
    router.push(`/task-details/${classTask.id}`);
  };

  if (isLoading) {
    return (
      <View className="my-4 px-2">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-quicksandBold">My Classes</Text>
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

  if (classTasks.length === 0) {
    return (
      <View className="my-4 px-2">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-quicksandBold">My Classes</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/AddTask")}>
            <Text className="text-indigo-600 font-quicksandSemiBold">
              Add Class
            </Text>
          </TouchableOpacity>
        </View>
        <View className="bg-indigo-50 p-4 rounded-lg">
          <Text className="text-center text-gray-600">
            No classes found. Add your first class task!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="my-4">
      <View className="flex-row justify-between items-center mb-3 px-2">
        <Text className="text-lg font-quicksandBold">My Classes</Text>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/(tabs)/Tasks",
              params: { filter: "Class" },
            });
          }}
        >
          <Text className="text-indigo-600 font-quicksandSemiBold">
            See All
          </Text>
        </TouchableOpacity>
      </View>
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
    </View>
  );
});

ClassesSection.displayName = "ClassesSection";

export default ClassesSection;
