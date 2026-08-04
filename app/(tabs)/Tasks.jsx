import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenAnimation from "../../components/ScreenAnimation";
import DateProcessor from "../../components/search/DateProcessor";
import SearchFilter from "../../components/search/SearchFilter";
import TaskSorter from "../../components/search/TaskSorter";
import TasksStats from "../../components/search/TasksStats";
import SearchBar from "../../components/SearchBar";
import TaskList from "../../components/taskList";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
const Tasks = () => {
  const { tasks, loading, refreshTasks } = useTasks();
  const { user } = useUser();
  const { isDark, colors } = useTheme();
  const { filter: filterParam } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("dueDateDesc");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'completed' | 'incomplete' | 'overdue' | 'dueToday'

  // Handle filter from URL params
  useEffect(() => {
    if (filterParam && ["dueToday", "overdue"].includes(filterParam)) {
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  // Optimize refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTasks?.();
    setRefreshing(false);
  }, [refreshTasks]);

  // Optimize search handler
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Optimize sort handlers
  const toggleSortVisible = useCallback(() => {
    setSortVisible((prev) => !prev);
  }, []);

  const handleSortOptionChange = useCallback((option) => {
    setSortOption(option);
    setSortVisible(false);
  }, []);

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
  } = TaskSorter({ filteredTasks, sortOption, activeFilter });

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
    <ScreenAnimation duration={400}>
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView className="flex-1 px-4 mt-8">
          {/* Header */}
          <View className="flex-row justify-between items-center py-4">
            <View>
              <Text
                className={`text-2xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                My Tasks
              </Text>
              <Text
                className={`font-quicksand ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {statusFilteredTasks.length} task
                {statusFilteredTasks.length !== 1 ? "s" : ""} in total
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSortVisible((v) => !v)}
              className={`flex-row items-center px-3 py-2 rounded-lg shadow-sm border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
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

          {/* Filter Chips */}
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 px-1">
                {[
                  { id: "all", label: "All Tasks" },
                  { id: "completed", label: "Completed" },
                  { id: "incomplete", label: "Incomplete" },
                  { id: "overdue", label: "Overdue" },
                  { id: "dueToday", label: "Due Today" },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      activeFilter === filter.id
                        ? isDark
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-indigo-500 border-indigo-500"
                        : isDark
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-quicksandMedium ${
                        activeFilter === filter.id
                          ? "text-white"
                          : isDark
                            ? "text-gray-300"
                            : "text-gray-700"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sort Dropdown */}
          {sortVisible && (
            <>
              <TouchableOpacity
                className="absolute inset-0"
                activeOpacity={1}
                onPress={() => setSortVisible(false)}
              />
              <View
                className={`absolute right-4 top-24 rounded-xl shadow-lg border w-64 z-50 ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                {[
                  { key: "dueDateAsc", label: "Due date: earliest first" },
                  { key: "dueDateDesc", label: "Due date: latest first" },
                  { key: "createdNew", label: "Created: newest first" },
                  { key: "createdOld", label: "Created: oldest first" },
                  { key: "priorityHighLow", label: "Priority: High → Low" },
                  { key: "priorityLowHigh", label: "Priority: Low → High" },
                  { key: "classes", label: "📚 Classes only" },
                  // { key: "completed", label: "✅ Completed tasks" },

                  // { key: "incomplete", label: "⏳ Incomplete tasks" },

                  // { key: "overdue", label: "🔴 Overdue tasks" },

                  // { key: "dueToday", label: "📅 Due today" },
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
                          ? `font-quicksandSemiBold ${
                              isDark ? "text-indigo-400" : "text-indigo-600"
                            }`
                          : `font-quicksand ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`
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
                {sortOption === "dueToday" && "No tasks due today!"}
                {searchQuery && `No tasks matching "${searchQuery}"`}
                {![
                  "classes",
                  "completed",
                  "incomplete",
                  "overdue",
                  "dueToday",
                ].includes(sortOption) &&
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
