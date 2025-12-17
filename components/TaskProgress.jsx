import React, { useContext, useMemo } from "react";
import { Text, View } from "react-native";
import { TasksContext } from "../context/TasksContext";

const TaskProgress = React.memo(() => {
  const { tasks } = useContext(TasksContext);

  const { totalTasks, completedTasks, progress } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.isCompleted).length;
    return {
      totalTasks: total,
      completedTasks: completed,
      progress: total > 0 ? completed / total : 0,
    };
  }, [tasks]);

  const uncompletedTasks = totalTasks - completedTasks;

  return (
    <View className="p-5 bg-white rounded-2xl my-4 mx-2 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-quicksandBold text-gray-800">
          Task Progress
        </Text>
        <View className="px-3 py-1 bg-indigo-50 rounded-full">
          <Text className="text-indigo-600 text-xs font-quicksandMedium">
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm font-quicksandSemiBold text-gray-600">
            Completed
          </Text>
          <Text className="text-sm font-quicksandSemiBold text-gray-600">
            {completedTasks} of {totalTasks}
          </Text>
        </View>
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>

      <View className="flex-row justify-between">
        <View className="items-center">
          <View className="w-10 h-10 bg-green-50 rounded-lg items-center justify-center mb-1">
            <Text className="text-green-600 font-quicksandBold">
              {completedTasks}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 font-quicksand">Done</Text>
        </View>

        <View className="items-center">
          <View className="w-10 h-10 bg-amber-50 rounded-lg items-center justify-center mb-1">
            <Text className="text-amber-600 font-quicksandBold">
              {uncompletedTasks}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 font-quicksand">Left</Text>
        </View>

        <View className="items-center">
          <View className="w-10 h-10 bg-indigo-50 rounded-lg items-center justify-center mb-1">
            <Text className="text-indigo-600 font-quicksandBold">
              {totalTasks}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 font-quicksand">Total</Text>
        </View>
      </View>
    </View>
  );
});

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
