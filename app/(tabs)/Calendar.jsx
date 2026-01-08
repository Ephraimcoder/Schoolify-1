import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import ScreenAnimation from "../../components/ScreenAnimation";
import CalendarTaskList from "../../components/calendar/CalendarTaskList";
import DateUtils from "../../components/calendar/DateUtils";
import { useTasks } from "../../context/TasksContext";

const CalendarScreen = () => {
  const router = useRouter();
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Use optimized DateUtils component
  const { tasksByDate, markedDates, tasksForDay, formattedSelectedDate } =
    DateUtils({ tasks, selectedDate });

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <ScreenAnimation duration={400}>
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
              {formattedSelectedDate}
            </Text>
            <Text className="text-sm font-quicksandMedium text-gray-500">
              {tasksForDay.length} {tasksForDay.length === 1 ? "task" : "tasks"}
            </Text>
          </View>

          {tasksForDay.length > 0 ? (
            <CalendarTaskList
              tasksForDay={tasksForDay}
              selectedDate={selectedDate}
              normalizeDate={(date) => date.toISOString().split("T")[0]}
            />
          ) : (
            <View className="flex-1 justify-center items-center py-10">
              <MaterialIcons name="calendar-today" size={48} color="#E5E7EB" />
              <Text className="text-gray-400 font-quicksandSemiBold mt-2">
                No tasks for this day
              </Text>
              <Text className="text-gray-400 font-quicksand text-center mt-1">
                Tap on + button to add a new task
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenAnimation>
  );
};

export default CalendarScreen;
