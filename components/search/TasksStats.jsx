import { Text, TouchableOpacity, View } from "react-native";

const TasksStats = ({
  filteredTasks,
  searchQuery,
  matchedSubtasks,
  onClearSearch,
}) => {
  return (
    <View className="mb-4 px-1 flex-row items-center justify-between">
      <Text className="text-gray-500 font-quicksand text-sm">
        Showing {filteredTasks.length} task
        {filteredTasks.length !== 1 ? "s" : ""}
        {matchedSubtasks.length > 0 &&
          ` & ${matchedSubtasks.length} subtask${matchedSubtasks.length !== 1 ? "s" : ""}`}{" "}
        {searchQuery && `for "${searchQuery}"`}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          onPress={onClearSearch}
          className="px-2 py-1 bg-gray-100 rounded-lg"
        >
          <Text className="text-gray-600 font-quicksand text-xs">Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TasksStats;
