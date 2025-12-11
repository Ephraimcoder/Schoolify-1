import React, { useContext, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { TasksContext } from "../context/TasksContext";
import TaskCard from "./TaskCard";

const TasksSection = React.memo(() => {
  const { tasks } = useContext(TasksContext);
  const limitedTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  return (
    <View className="my-4">
      <View className="flex-row justify-between items-center mb-4 mx-2"></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {limitedTasks && limitedTasks.length > 0 ? (
          limitedTasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <View className="w-64 items-center justify-center p-4">
            <Text className="text-gray-500 font-quicksandSemiBold text-center">
              You haven't created any tasks yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

TasksSection.displayName = "TasksSection";

export default TasksSection;
