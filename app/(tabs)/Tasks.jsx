import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [sortOption, setSortOption] = useState("dueDateAsc"); // default
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks?.();
    setRefreshing(false);
  };

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

  // Debounced search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { tasks: tasks, matchedSubtasks: [] };
    }

    const query = searchQuery.toLowerCase();
    const matchedTasks = [];
    const matchedSubtasks = [];

    tasks.forEach((task) => {
      // Check if parent task matches
      const taskMatches =
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.toLowerCase().includes(query) ||
        task.priority?.toLowerCase().includes(query) ||
        task.dueDate?.toLowerCase().includes(query) ||
        task.dueTime?.toLowerCase().includes(query);

      // Check which subtasks match
      const matchingSubtasks =
        task.subTasks?.filter((subTask) =>
          subTask.title.toLowerCase().includes(query)
        ) || [];

      // If task matches, include it
      if (taskMatches) {
        matchedTasks.push(task);
        if (matchingSubtasks.length > 0) {
          matchedSubtasks.push(...matchingSubtasks);
        }
      } else if (matchingSubtasks.length > 0) {
        // If only subtasks match, include the parent task
        matchedTasks.push(task);
        matchedSubtasks.push(...matchingSubtasks);
      }
    });

    return { tasks: matchedTasks, matchedSubtasks };
  }, [tasks, searchQuery]);

  const { tasks: filteredTasks, matchedSubtasks } = searchResults;

  // Group tasks by status or due date
  const tasksByDate = filteredTasks.reduce((acc, task) => {
    const date = task.dueDate
      ? new Date(task.dueDate).toDateString()
      : "No Date";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  // Helpers for sorting within a date group
  const priorityRank = (p) => {
    const v = (p || "").toLowerCase();
    if (v === "high") return 3;
    if (v === "medium") return 2;
    if (v === "low") return 1;
    return 0;
  };

  const sortTasksInGroup = (arr) => {
    const copy = [...arr];
    switch (sortOption) {
      case "createdNew":
        return copy.sort(
          (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        );
      case "createdOld":
        return copy.sort(
          (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
        );
      case "priorityHighLow":
        return copy.sort(
          (a, b) => priorityRank(b.priority) - priorityRank(a.priority)
        );
      case "priorityLowHigh":
        return copy.sort(
          (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
        );
      case "dueDateDesc":
      case "dueDateAsc":
      default:
        // Keep original order for group when sorting by date at the group level
        return copy;
    }
  };

  // Sort date groups by due date (and keep "No Date" last)
  let sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === "No Date") return 1;
    if (b === "No Date") return -1;
    return new Date(a) - new Date(b);
  });
  if (sortOption === "dueDateDesc") {
    const noDate = sortedDates.includes("No Date");
    const datesOnly = sortedDates.filter((d) => d !== "No Date").reverse();
    sortedDates = noDate ? [...datesOnly, "No Date"] : datesOnly;
  }

  // Apply in-group sorting based on selected option
  const tasksByDateSorted = Object.fromEntries(
    sortedDates.map((d) => [d, sortTasksInGroup(tasksByDate[d])])
  );

  // Flat mode for created date sorting: single column, stacked top-to-bottom
  const flatMode = sortOption === "createdNew" || sortOption === "createdOld";
  const flatTasks = useMemo(() => {
    if (!flatMode) return [];
    const arr = [...filteredTasks];
    if (sortOption === "createdNew") {
      return arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    return arr.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [filteredTasks, sortOption, flatMode]);

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
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={["#FFFBF5", "#FEFBF6"]} className="flex-1">
        <SafeAreaView className="flex-1 px-4 mt-8">
          {/* Header */}
          <View className="flex-row justify-between items-center py-4">
            <View>
              <Text className="text-2xl font-quicksandBold text-gray-900">
                My Tasks
              </Text>
              <Text className="text-gray-500 font-quicksand">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} in total
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSortVisible((v) => !v)}
              className="flex-row items-center px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-100"
              activeOpacity={0.8}
            >
              <Ionicons name="funnel-outline" size={18} color="#4F46E5" />
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

          {searchQuery?.length > 0 && (
            <View className="mb-4 px-1 flex-row items-center justify-between">
              <Text className="text-gray-500 font-quicksand text-sm">
                Showing {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}
                {matchedSubtasks.length > 0 &&
                  ` & ${matchedSubtasks.length} subtask${matchedSubtasks.length !== 1 ? "s" : ""}`}{" "}
                for "{searchQuery}"
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="px-2 py-1 bg-gray-100 rounded-lg"
              >
                <Text className="text-gray-600 font-quicksand text-xs">
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tasks List */}
          <TaskList
            tasks={filteredTasks}
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
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
};

export default Tasks;
