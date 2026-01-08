import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenAnimation from "../../components/ScreenAnimation";
import DateProcessor from "../../components/search/DateProcessor";
import SearchFilter from "../../components/search/SearchFilter";
import TaskSorter from "../../components/search/TaskSorter";
import TasksStats from "../../components/search/TasksStats";
import SearchBar from "../../components/SearchBar";
import TaskList from "../../components/taskList";
import { useTasks } from "../../context/TasksContext";
import { useUser } from "../../context/UserContext";

const Tasks = () => {
  const { tasks, loading, refreshTasks } = useTasks();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("dueDateDesc"); // default to latest first

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks?.();
    setRefreshing(false);
  };

  // Pre-process dates for better performance
  const processedTasks = DateProcessor({ tasks });

  // Apply search filtering
  const { tasks: filteredTasks, matchedSubtasks } = SearchFilter({
    tasks: processedTasks,
    searchQuery,
  });

  // Apply sorting and grouping
  const {
    statusFilteredTasks,
    tasksByDateSorted,
    sortedDates,
    flatMode,
    flatTasks,
  } = TaskSorter({ filteredTasks, sortOption });

  // Helpers for search highlight
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const renderHighlightedText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
    const parts = String(text).split(regex);
    return parts.map((part, i) => {
      const isMatch = part.toLowerCase() === query.toLowerCase();
      return isMatch ? (
        <Text key={i} className="bg-yellow-100 text-gray-900 rounded-sm">
          {part}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      );
    });
  };

  // Helper for priority badge styling in inline cards
  const getPriorityClasses = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 border-red-200 text-red-700";
      case "medium":
        return "bg-amber-100 border-amber-200 text-amber-700";
      case "low":
        return "bg-emerald-100 border-emerald-200 text-emerald-700";
      default:
        return "bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <ScreenAnimation duration={400}>
      <LinearGradient colors={["#FFFBF5", "#FEFBF6"]} className="flex-1">
        <SafeAreaView className="flex-1 px-4 mt-8">
          {/* Header */}
          <View className="flex-row justify-between items-center py-4">
            <View>
              <Text className="text-2xl font-quicksandBold text-gray-900">
                My Tasks
              </Text>
              <Text className="text-gray-500 font-quicksand">
                {statusFilteredTasks.length} task
                {statusFilteredTasks.length !== 1 ? "s" : ""} in total
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSortVisible((v) => !v)}
              className="flex-row items-center px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-100"
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={18} color="#4F46E5" />
              <Text className="ml-2 text-indigo-600 font-quicksandSemiBold text-sm">
                Sort
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="mb-2">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="Search tasks..."
            />
          </View>

          {/* Sort Dropdown */}
          {sortVisible && (
            <>
              <TouchableOpacity
                className="absolute inset-0"
                activeOpacity={1}
                onPress={() => setSortVisible(false)}
              />
              <View className="absolute right-4 top-24 bg-white rounded-xl shadow-lg border border-gray-100 w-64 z-50">
                {[
                  { key: "dueDateAsc", label: "Due date: earliest first" },
                  { key: "dueDateDesc", label: "Due date: latest first" },
                  { key: "createdNew", label: "Created: newest first" },
                  { key: "createdOld", label: "Created: oldest first" },
                  { key: "priorityHighLow", label: "Priority: High → Low" },
                  { key: "priorityLowHigh", label: "Priority: Low → High" },
                  { key: "classes", label: "📚 Classes only" },
                  { key: "completed", label: "✅ Completed tasks" },
                  { key: "incomplete", label: "⏳ Incomplete tasks" },
                  { key: "overdue", label: "🔴 Overdue tasks" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    className="px-4 py-3 flex-row items-center justify-between"
                    onPress={() => {
                      setSortOption(opt.key);
                      setSortVisible(false);
                    }}
                  >
                    <Text
                      className={
                        opt.key === sortOption
                          ? "text-indigo-600 font-quicksandSemiBold"
                          : "text-gray-700 font-quicksand"
                      }
                    >
                      {opt.label}
                    </Text>
                    {opt.key === sortOption && (
                      <Ionicons name="checkmark" size={16} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Search Stats */}
          {searchQuery?.length > 0 && (
            <TasksStats
              filteredTasks={filteredTasks}
              searchQuery={searchQuery}
              matchedSubtasks={matchedSubtasks}
              onClearSearch={() => setSearchQuery("")}
            />
          )}

          {/* Tasks List */}
          {statusFilteredTasks.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="filter-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 font-quicksandBold text-lg mt-4 mb-2">
                No tasks found
              </Text>
              <Text className="text-gray-400 font-quicksand text-center px-8">
                {sortOption === "classes" && "No classes available"}
                {sortOption === "completed" && "No completed tasks yet"}
                {sortOption === "incomplete" && "All tasks are completed!"}
                {sortOption === "overdue" && "No overdue tasks - great job!"}
                {searchQuery && `No tasks matching "${searchQuery}"`}
                {!["classes", "completed", "incomplete", "overdue"].includes(
                  sortOption
                ) &&
                  !searchQuery &&
                  "No tasks available"}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-indigo-100 rounded-lg"
                >
                  <Text className="text-indigo-600 font-quicksandSemiBold">
                    Clear search
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TaskList
              tasks={statusFilteredTasks}
              tasksByDate={tasksByDateSorted}
              sortedDates={sortedDates}
              getPriorityClasses={getPriorityClasses}
              onRefresh={onRefresh}
              refreshing={refreshing}
              searchQuery={searchQuery}
              renderHighlightedText={renderHighlightedText}
              matchedSubtasks={matchedSubtasks}
              flatMode={flatMode}
              flatTasks={flatTasks}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </ScreenAnimation>
  );
};

export default Tasks;
