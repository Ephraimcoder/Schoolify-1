import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { TasksContext } from "../../context/TasksContext";

const CalendarScreen = () => {
  const router = useRouter();
  const { tasks } = useContext(TasksContext);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Helper function to normalize dates to the start of the day for comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Build markedDates with dots for each date with tasks (memoized)
  const markedDates = useMemo(() => {
    const today = normalizeDate(new Date());
    const dates = {};

    tasks.forEach((task) => {
      if (task.dueDate && !task.isCompleted) {
        const taskDate = normalizeDate(new Date(task.dueDate));
        const dateKey = taskDate.toISOString().split("T")[0];

        if (!dates[dateKey]) {
          dates[dateKey] = {
            marked: true,
            hasFutureTasks: false,
            hasPastTasks: false,
          };
        }

        // Track if this date has future or past tasks
        if (taskDate >= today) {
          dates[dateKey].hasFutureTasks = true;
        } else {
          dates[dateKey].hasPastTasks = true;
        }
      }
    });

    // Apply colors based on task dates
    Object.keys(dates).forEach((dateKey) => {
      const dateInfo = dates[dateKey];
      // Orange if there are future tasks, grey if only past tasks
      dateInfo.dotColor = dateInfo.hasFutureTasks ? "#FF6B47" : "#9CA3AF";
      dateInfo.textColor = dateInfo.hasFutureTasks ? undefined : "#9CA3AF";
      dateInfo.disabled = false;
    });

    // Add selected styling
    dates[selectedDate] = {
      ...(dates[selectedDate] || {}),
      selected: true,
      selectedColor: "#FF6B47",
      selectedTextColor: "#FFFFFF",
    };

    return dates;
  }, [tasks, selectedDate]);

  // Filter tasks for the selected day (memoized)
  const tasksForDay = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split("T")[0];
      return taskDate === selectedDate && !task.isCompleted;
    });
  }, [tasks, selectedDate]);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View className="flex-1 bg-[#FEFBF6] px-4 pt-4">
      <View className="flex-row items-center justify-between mt-6 p-4">
        <Text className="text-2xl font-quicksandBold text-gray-800">
          Calendar
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: "#FFFFFF",
            calendarBackground: "#FFFFFF",
            textSectionTitleColor: "#6B7280",
            selectedDayBackgroundColor: "#FF6B47",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#FF6B47",
            dayTextColor: "#1F2937",
            textDisabledColor: "#D1D5DB",
            dotColor: "#FF6B47",
            selectedDotColor: "#FFFFFF",
            arrowColor: "#FF6B47",
            monthTextColor: "#1F2937",
            textDayFontFamily: "Quicksand-Medium",
            textMonthFontFamily: "Quicksand-Bold",
            textDayHeaderFontFamily: "Quicksand-SemiBold",
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
          style={{
            borderRadius: 12,
            elevation: 0,
          }}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-quicksandSemiBold text-gray-800">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text className="text-sm font-quicksandMedium text-gray-500">
            {tasksForDay.length} {tasksForDay.length === 1 ? "task" : "tasks"}
          </Text>
        </View>

        {tasksForDay.length > 0 ? (
          <FlatList
            data={tasksForDay}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`rounded-xl p-4 mb-3 shadow-sm ${normalizeDate(new Date(item.dueDate)) < normalizeDate(new Date()) ? "bg-gray-50" : "bg-white"}`}
                onPress={() =>
                  router.push({
                    pathname: "/task-details/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <View className="flex-row justify-between items-start">
                  <Text
                    className={`sfont-quicksandSemiBold text-base ${
                      item.isCompleted
                        ? "line-through text-gray-400"
                        : normalizeDate(new Date(item.dueDate)) <
                            normalizeDate(new Date())
                          ? "text-gray-500"
                          : "text-gray-800"
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                    {normalizeDate(new Date(item.dueDate)) <
                      normalizeDate(new Date()) && (
                      <Text className="text-xs font-quicksandMedium text-red-500 ml-2">
                        Overdue
                      </Text>
                    )}
                  </Text>
                  {item.dueDate && (
                    <View className="flex-row items-center ml-2">
                      <MaterialIcons
                        name="access-time"
                        size={14}
                        color="#6B7280"
                      />
                      <Text className="text-xs font-quicksandMedium text-gray-500 ml-1">
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
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center py-10">
            <MaterialIcons name="calendar-today" size={48} color="#E5E7EB" />
            <Text className="text-gray-400 font-quicksandSemiBold mt-2">
              No tasks for this day
            </Text>
            <Text className="text-gray-400 font-quicksand text-center mt-1">
              Tap the + button to add a new task
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CalendarScreen;
