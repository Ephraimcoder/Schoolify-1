import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenAnimation from "../../components/ScreenAnimation";
import CalendarTaskList from "../../components/calendar/CalendarTaskList";
import DateUtils from "../../components/calendar/DateUtils";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
const CalendarScreen = () => {
  const router = useRouter();
  const { tasks } = useTasks();
  const { isDark, colors } = useTheme();
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
      <SafeAreaView
        className={`flex-1 px-4 pt-4 ${
          isDark ? "bg-gray-900" : "bg-[#FEFBF6]"
        }`}
      >
        <View className="flex-row items-center justify-between mt-6 p-4">
          <Text
            className={`text-2xl font-quicksandBold ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Calendar
          </Text>
        </View>

        <View
          className={`rounded-2xl p-4 mb-4 shadow-sm ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Calendar
            key={`calendar-${isDark ? "dark" : "light"}`} // force re-render when theme changes
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              calendarBackground: isDark ? "#1F2937" : "#FFFFFF",
              textSectionTitleColor: isDark ? "#9CA3AF" : "#6B7280",
              selectedDayBackgroundColor: isDark ? "#6366F1" : "#FF6B47",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: isDark ? "#6366F1" : "#FF6B47",
              dayTextColor: isDark ? "#D1D5DB" : "#374151",
              textDisabledColor: isDark ? "#6B7280" : "#9CA3AF",
              dotColor: isDark ? "#6366F1" : "#FF6B47",
              selectedDotColor: "#FFFFFF",
              monthTextColor: isDark ? "#D1D5DB" : "#374151",
              arrowColor: isDark ? "#9CA3AF" : "#6B7280",
              arrowStyle: "fill",
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
            <Text
              className={`text-lg font-quicksandSemiBold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              {formattedSelectedDate}
            </Text>
            <Text
              className={`text-sm font-quicksandMedium ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
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
              <MaterialIcons
                name="calendar-today"
                size={48}
                color={isDark ? "#6B7280" : "#E5E7EB"}
              />
              <Text
                className={`font-quicksandSemiBold mt-2 ${
                  isDark ? "text-gray-400" : "text-gray-400"
                }`}
              >
                No tasks for this day
              </Text>
              <Text
                className={`font-quicksand text-center mt-1 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Tap on + button to add a new task
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScreenAnimation>
  );
};

export default CalendarScreen;
