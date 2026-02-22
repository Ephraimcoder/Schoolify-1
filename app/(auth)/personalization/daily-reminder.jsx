import { Ionicons } from "@expo/vector-icons";
import { useDatabase } from "@nozbe/watermelondb/react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import {
  cancelDailyReminder,
  scheduleDailyReminder,
} from "../../../utils/dailyReminder";

// UI-only: subtle shadow styling for hero card
const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
});

export default function DailyReminder() {
  const router = useRouter();
  const database = useDatabase();
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { isDark, colors } = useTheme();

  const handleNext = async () => {
    try {
      const hour = reminderTime.getHours();
      const minute = reminderTime.getMinutes();

      if (dailyReminder) {
        // Schedule and persist the reminder
        await scheduleDailyReminder(hour, minute);
      } else {
        // Disable any existing reminder
        await cancelDailyReminder();
      }

      router.push("/(auth)/personalization/backup-settings");
    } catch (error) {
      console.error("Error saving daily reminder preference:", error);
      // Still proceed even if database save fails
      router.push("/(auth)/personalization/backup-settings");
    }
  };

  const handleSkip = async () => {
    try {
      // Save the default state when skipping
      const hour = reminderTime.getHours();
      const minute = reminderTime.getMinutes();

      if (dailyReminder) {
        // Schedule and persist the reminder with default settings
        await scheduleDailyReminder(hour, minute);
      } else {
        // Disable any existing reminder
        await cancelDailyReminder();
      }

      router.push("/(auth)/personalization/backup-settings");
    } catch (error) {
      console.error("Error saving daily reminder preference on skip:", error);
      // Still proceed even if database save fails
      router.push("/(auth)/personalization/backup-settings");
    }
  };

  const formatTimeDisplay = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const showTimePicker = () => {
    setShowPicker(true);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background[0] }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 180,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View className="items-center">
          <Text
            className="text-2xl font-quicksandBold"
            style={{ color: colors.text }}
          >
            Schoolify<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        {/* Hero card with illustration */}
        <View className="items-center mt-6">
          <View
            className="w-11/12 h-44 rounded-3xl items-center justify-center overflow-hidden"
            style={[cardShadow, { backgroundColor: colors.card }]}
          >
            {/* Calendar/clock illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Calendar base */}
                <View className="w-16 h-20 bg-orange-500 rounded-t-lg" />
                <View className="absolute top-2 left-2 w-12 h-16 bg-orange-600 rounded-t" />
                <View className="absolute top-1 left-1 w-10 h-14 bg-white rounded-t" />
                {/* Clock overlay */}
                <View className="absolute -right-2 top-4 w-12 h-12 bg-blue-500 rounded-full border-4 border-white" />
                <View className="absolute -right-0 top-6 w-8 h-8 bg-white rounded-full" />
                {/* Clock hands */}
                <View className="absolute top-8 right-2 w-1 h-4 bg-blue-600" />
                <View className="absolute top-8 right-2 w-3 h-1 bg-blue-600" />
              </View>

              <Text
                className="font-quicksandBold text-lg text-center"
                style={{ color: colors.text }}
              >
                Daily Reminders
              </Text>
              <Text
                className="font-quicksandMedium text-sm text-center mt-1"
                style={{ color: colors.textSecondary }}
              >
                Stay on track every day
              </Text>
            </View>
          </View>
        </View>

        {/* Header */}
        <View className="items-center mt-8">
          <Text
            className="text-5xl font-quicksandBold text-center"
            style={{ color: colors.text }}
          >
            Daily Nudges
          </Text>
          <Text
            className="text-xl text-center font-quicksandMedium mt-3 leading-6"
            style={{ color: colors.textSecondary }}
          >
            Gentle reminders to keep you on track
          </Text>
        </View>

        {/* Settings Card */}
        <View className="mt-10">
          <View
            className="rounded-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            {/* Enable/Disable */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text
                  className="font-quicksandBold text-lg"
                  style={{ color: colors.text }}
                >
                  Daily Reminder
                </Text>
                <Text
                  className="font-quicksandMedium text-sm mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Receive daily task summaries
                </Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: "#E5E7EB", true: "#FED7AA" }}
                thumbColor={dailyReminder ? "#EA580C" : "#9CA3AF"}
                key={`daily-reminder-${dailyReminder}`}
              />
            </View>

            {/* Time Selection */}
            {dailyReminder && (
              <View
                className="border-t pt-6"
                style={{ borderColor: colors.border }}
              >
                <Text
                  className="font-quicksandBold text-lg mb-4"
                  style={{ color: colors.text }}
                >
                  Reminder Time
                </Text>

                <TouchableOpacity
                  onPress={showTimePicker}
                  className="p-4 rounded-2xl flex-row items-center justify-between"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="time"
                      size={24}
                      color={colors.primary}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text
                        className="font-quicksandMedium text-base"
                        style={{ color: colors.text }}
                      >
                        {formatTimeDisplay(reminderTime)}
                      </Text>
                      <Text
                        className="font-quicksandMedium text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        Tap to change time
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Benefits */}
            <View className="mt-6 space-y-3 gap-2">
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm"
                  style={{ color: colors.text }}
                >
                  Daily task overview
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm"
                  style={{ color: colors.text }}
                >
                  Never miss important deadlines
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm"
                  style={{ color: colors.text }}
                >
                  Build consistent study habits
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing reserved for pinned CTA */}
        <View className="h-10" />

        {/* CTA + skip */}
        <View className="mt-6">
          <TouchableOpacity
            className="h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleNext}
          >
            <Text className="text-white font-quicksandBold text-lg">
              Sounds good!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text
              className="font-quicksandMedium text-base"
              style={{ color: colors.textSecondary }}
            >
              Maybe later
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}
