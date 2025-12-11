import React, { useContext, useMemo } from "react";
import { Text, View } from "react-native";
import { TasksContext } from "../context/TasksContext";

const TaskProgress = React.memo(() => {
  const { tasks } = useContext(TasksContext);
  
  const { totalTasks, completedTasks, progress, todaysDate } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.isCompleted).length;
    return {
      totalTasks: total,
      completedTasks: completed,
      progress: completed / total,
      todaysDate: new Date().toLocaleDateString(),
    };
  }, [tasks]);
  return (
    <View className="p-6 rounded-2xl my-4 mx-2">
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-xl font-bold text-gray-800 font-quicksandLight">
            Task Progress
          </Text>
          <Text className="text-base text-gray-500 mt-1 font-quicksandMedium">
            {completedTasks}/{totalTasks} task done
          </Text>
          <View className="bg-orange-100 px-3 py-1 rounded-full mt-2">
            <Text className="text-orange-500 font-quicksandBold">
              {todaysDate}
            </Text>
          </View>
        </View>
        <View className="w-24 h-24 items-center justify-center">
          <View className="absolute w-24 h-24 rounded-full border-[12px] border-gray-200" />
          <View
            className="absolute w-24 h-24 rounded-full border-[12px] border-orange-400"
            style={{
              borderTopColor: "transparent",
              transform: [{ rotate: `${45 + progress * 360}deg` }],
            }}
          />
          <Text className="text-2xl font-bold text-gray-800">
            {Math.round(progress * 100) || 0}%
          </Text>
        </View>
      </View>
    </View>
  );
});

TaskProgress.displayName = 'TaskProgress';

export default TaskProgress;
