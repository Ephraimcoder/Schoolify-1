import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "../../components/SearchBar";
import TaskList from "../../components/taskList";
import { TasksContext } from "../../context/TasksContext";
import { useUser } from "../../context/UserContext";

const Tasks = () => {
  const { tasks, loading, refreshTasks } = useContext(TasksContext);
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation on mount
  React.useEffect(() => {
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

  // Filter tasks based on search query
  const getSearchResults = () => {
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
      }

      // If subtasks match, add them to the subtask results
      if (matchingSubtasks.length > 0) {
        matchingSubtasks.forEach((subtask) => {
          matchedSubtasks.push({
            subtask,
            parentTask: task,
            parentTaskId: task.id,
            parentTaskTitle: task.title,
            parentTaskColor: task.color || "#4F46E5",
            parentTaskCategory: task.category,
          });
        });

        // Also include parent task if not already included
        if (!taskMatches) {
          matchedTasks.push(task);
        }
      }
    });

    return { tasks: matchedTasks, matchedSubtasks };
  };

  const { tasks: filteredTasks, matchedSubtasks } = useMemo(
    () => getSearchResults(),
    [tasks, searchQuery]
  );

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

  // Sort tasks by due date
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === "No Date") return 1;
    if (b === "No Date") return -1;
    return new Date(a) - new Date(b);
  });

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
            tasksByDate={tasksByDate}
            sortedDates={sortedDates}
            getPriorityClasses={getPriorityClasses}
            onRefresh={onRefresh}
            refreshing={refreshing}
            searchQuery={searchQuery}
            renderHighlightedText={renderHighlightedText}
            matchedSubtasks={matchedSubtasks}
          />
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
};

export default Tasks;
