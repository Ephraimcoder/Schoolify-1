import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Memoized Task Item Component
const TaskItem = React.memo(
  ({
    task,
    searchQuery,
    renderHighlightedText,
    isSubtask = false,
    parentTaskColor,
    getPriorityClasses,
    onPress,
    fullWidth = false,
  }) => {
    const color = isSubtask ? parentTaskColor : task.color || "#4F46E5";

    return (
      <TouchableOpacity
        className={fullWidth ? "w-full px-2 mb-4" : "w-1/2 px-2 mb-4"}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View
          className={`${isSubtask ? "bg-amber-50" : "bg-white"} rounded-2xl shadow-sm p-4 border-l-4`}
          style={{ borderLeftColor: color }}
        >
          {/* Task/Subtask content */}
          {isSubtask ? (
            <>
              <View className="flex-row items-center mb-2 pb-2 border-b border-amber-100">
                <Ionicons name="arrow-up-circle" size={14} color={color} />
                <Text
                  className="text-[10px] font-quicksandSemiBold ml-1 flex-1"
                  style={{ color }}
                  numberOfLines={1}
                >
                  From: {task.parentTaskTitle}
                </Text>
              </View>
              <View className="self-start mb-2">
                <Text
                  className="text-[10px] font-quicksandSemiBold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {task.parentTaskCategory}
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <View className="w-4 h-4 rounded border border-gray-400 mr-2 mt-0.5" />
                <Text
                  className="text-sm font-quicksandBold text-gray-900 flex-1"
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {renderHighlightedText?.(task.subtask.title, searchQuery) ||
                    task.subtask.title}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View className="flex-row justify-between items-start mb-2">
                {task.category && (
                  <Text
                    className="text-[10px] font-quicksandSemiBold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {task.category}
                  </Text>
                )}
                {task.priority && (
                  <View
                    className={`px-1.5 py-0.5 rounded-full border ${getPriorityClasses(task.priority)}`}
                  >
                    <Text className="text-[10px] font-quicksandBold uppercase">
                      {task.priority.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="text-sm font-quicksandBold text-gray-900 mb-1"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {searchQuery
                  ? renderHighlightedText?.(task.title, searchQuery) ||
                    task.title
                  : task.title}
              </Text>
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                  <Text className="text-[10px] text-gray-600 font-quicksandSemiBold ml-1">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "No date"}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text className="text-[10px] text-gray-600 font-quicksandSemiBold ml-1">
                    {task.dueTime
                      ? new Date(task.dueTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

export const TaskList = ({
  tasks,
  tasksByDate,
  sortedDates,
  getPriorityClasses,
  onRefresh,
  refreshing,
  searchQuery,
  renderHighlightedText,
  matchedSubtasks = [],
  flatMode = false,
  flatTasks = [],
}) => {
  const router = useRouter();

  // Handle task press
  const handleTaskPress = useCallback((taskId) => {
    router.push(`/task-details/${taskId}`);
  }, []);

  // Memoize the renderItem function
  const renderTaskItem = useMemo(
    () => ({
      task: ({ item }) => (
        <TaskItem
          task={item}
          searchQuery={searchQuery}
          renderHighlightedText={renderHighlightedText}
          getPriorityClasses={getPriorityClasses}
          onPress={() => handleTaskPress(item.id)}
          fullWidth={flatMode}
        />
      ),
      subtask: ({ item }) => (
        <TaskItem
          task={item}
          isSubtask
          searchQuery={searchQuery}
          renderHighlightedText={renderHighlightedText}
          parentTaskColor={item.parentTaskColor}
          onPress={() => handleTaskPress(item.parentTaskId)}
        />
      ),
    }),
    [
      searchQuery,
      renderHighlightedText,
      getPriorityClasses,
      handleTaskPress,
      flatMode,
    ]
  );

  // Memoize the key extractors
  const keyExtractors = useMemo(
    () => ({
      task: (item) => `task-${item.id}`,
      subtask: (item, index) => `subtask-${item.parentTaskId}-${index}`,
    }),
    []
  );

  // Get item layout for FlatList optimization
  const getItemLayout = useMemo(
    () => (data, index) => ({
      length: 200, // Approximate height of each item
      offset: 200 * index,
      index,
    }),
    []
  );

  // Flat list mode for created date sorting
  if (flatMode) {
    return (
      <FlatList
        key="flat"
        data={flatTasks}
        renderItem={renderTaskItem.task}
        keyExtractor={keyExtractors.task}
        numColumns={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          searchQuery && matchedSubtasks.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="h-6 w-1 bg-amber-500 rounded-r mr-2" />
                <Ionicons name="list" size={18} color="#F59E0B" />
                <Text className="text-gray-700 font-quicksandBold ml-2">
                  Matched Subtasks
                </Text>
                <Text className="ml-2 text-gray-400 text-sm font-quicksand">
                  ({matchedSubtasks.length} subtask
                  {matchedSubtasks.length !== 1 ? "s" : ""})
                </Text>
              </View>
              <FlatList
                key="matched-subtasks"
                data={matchedSubtasks}
                renderItem={renderTaskItem.subtask}
                keyExtractor={keyExtractors.subtask}
                numColumns={2}
                getItemLayout={getItemLayout}
                initialNumToRender={4}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
              />
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={6}
        getItemLayout={getItemLayout}
      />
    );
  }

  // Render a single date section
  const renderDateSection = (date) => (
    <View key={date} className="mb-6">
      <View className="flex-row items-center mb-3">
        <View className="h-6 w-1 bg-indigo-500 rounded-r mr-2" />
        <Text className="text-gray-700 font-quicksandBold">
          {date === "No Date"
            ? "No Due Date"
            : new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
        </Text>
        <Text className="ml-2 text-gray-400 text-sm font-quicksand">
          ({tasksByDate[date].length} task
          {tasksByDate[date].length !== 1 ? "s" : ""})
        </Text>
      </View>
      <FlatList
        key={`grid-${date}`}
        data={tasksByDate[date]}
        renderItem={renderTaskItem.task}
        keyExtractor={keyExtractors.task}
        numColumns={2}
        getItemLayout={getItemLayout}
        initialNumToRender={4}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );

  return (
    <FlatList
      key="grouped"
      data={sortedDates}
      renderItem={({ item: date }) => renderDateSection(date)}
      keyExtractor={(date) => `date-${date}`}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        searchQuery && matchedSubtasks.length > 0 ? (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="h-6 w-1 bg-amber-500 rounded-r mr-2" />
              <Ionicons name="list" size={18} color="#F59E0B" />
              <Text className="text-gray-700 font-quicksandBold ml-2">
                Matched Subtasks
              </Text>
              <Text className="ml-2 text-gray-400 text-sm font-quicksand">
                ({matchedSubtasks.length} subtask
                {matchedSubtasks.length !== 1 ? "s" : ""})
              </Text>
            </View>
            <FlatList
              key="matched-subtasks"
              data={matchedSubtasks}
              renderItem={renderTaskItem.subtask}
              keyExtractor={keyExtractors.subtask}
              numColumns={2}
              getItemLayout={getItemLayout}
              initialNumToRender={4}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </View>
        ) : null
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={3}
      getItemLayout={getItemLayout}
    />
  );
};

export default memo(TaskList);
