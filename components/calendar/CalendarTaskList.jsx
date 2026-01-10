import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
const CalendarTaskList = ({
  tasksForDay = [],
  selectedDate,
  normalizeDate,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }) => {
    // Guard against undefined item
    if (!item) return null;

    return (
      <TouchableOpacity
        className={`rounded-xl p-4 mb-3 shadow-sm ${
          normalizeDate(new Date(item.dueDate)) < normalizeDate(new Date())
            ? isDark
              ? "bg-gray-800"
              : "bg-gray-50"
            : isDark
              ? "bg-gray-700"
              : "bg-white"
        }`}
        onPress={() =>
          router.push({
            pathname: "/task-details/[id]",
            params: { id: item.id },
          })
        }
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className={`font-quicksandSemiBold text-base ${
                item.isCompleted
                  ? "line-through text-gray-400"
                  : normalizeDate(new Date(item.dueDate)) <
                      normalizeDate(new Date())
                    ? isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                    : isDark
                      ? "text-gray-100"
                      : "text-gray-800"
              }`}
              numberOfLines={1}
            >
              {item.title || "No title"}
            </Text>
            {normalizeDate(new Date(item.dueDate)) <
              normalizeDate(new Date()) && (
              <Text
                className={`text-xs font-quicksandMedium mt-1 ${
                  isDark ? "text-purple-400" : "text-red-500"
                }`}
              >
                Overdue
              </Text>
            )}
          </View>
          {item.dueDate && (
            <View className="flex-row items-center ml-2">
              <MaterialIcons
                name="access-time"
                size={14}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`text-xs font-quicksandMedium ml-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {(() => {
                  const date = new Date(item.dueDate);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                })()}
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text
            className="text-sm font-quicksand text-gray-500 mt-1"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {item.priority && (
          <View
            className={`self-start mt-2 px-2 py-1 rounded-full ${
              item.priority === "High"
                ? "bg-red-100"
                : item.priority === "Medium"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
            }`}
          >
            <Text
              className={`text-xs font-quicksandSemiBold ${
                item.priority === "High"
                  ? "text-red-800"
                  : item.priority === "Medium"
                    ? "text-yellow-800"
                    : "text-blue-800"
              }`}
            >
              {item.priority} Priority
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={tasksForDay}
      keyExtractor={(item) => item?.id || Math.random().toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={renderItem}
    />
  );
};

export default CalendarTaskList;
