import { Ionicons } from "@expo/vector-icons";
import { useDatabase } from "@nozbe/watermelondb/react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const handleNext = async () => {
    try {
      // Save daily reminder preference to database
      const reminderPrefs = database.collections.get("reminder_prefs");
      const existingPrefs = await reminderPrefs.query().fetch();

      await database.write(async () => {
        if (existingPrefs.length > 0) {
          // Update existing preference
          await existingPrefs[0].update((pref) => {
            pref.enabled = dailyReminder;
            pref.hour = reminderTime.getHours();
            pref.minute = reminderTime.getMinutes();
          });
        } else {
          // Create new preference record
          await reminderPrefs.create((pref) => {
            pref.enabled = dailyReminder;
            pref.hour = reminderTime.getHours();
            pref.minute = reminderTime.getMinutes();
          });
        }
      });

      console.log("Daily reminder saved to database:", {
        enabled: dailyReminder,
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes(),
      });
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error saving daily reminder preference:", error);
      // Still proceed even if database save fails
      router.replace("/(auth)/sign-in");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/sign-in");
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
    <SafeAreaView className="flex-1 bg-amber-50">
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
          <Text className="text-2xl font-quicksandBold">
            Schoolify<Text className="text-orange-600">.</Text>
          </Text>
        </View>

        {/* Hero card with illustration */}
        <View className="items-center mt-6">
          <View
            className="w-11/12 h-44 bg-white rounded-3xl items-center justify-center overflow-hidden"
            style={[cardShadow]}
          >
            {/* Calendar/clock illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Calendar base */}
                <View className="w-16 h-20 bg-orange-500 rounded-t-lg" />
                <View className="absolute top-2 left-2 w-12 h-16 bg-orange-600 rounded-t" />
                {/* Calendar pages */}
                <View className="absolute top-1 left-1 w-10 h-14 bg-white rounded-t" />
                {/* Clock overlay */}
                <View className="absolute -right-2 top-4 w-12 h-12 bg-blue-500 rounded-full border-4 border-white" />
                <View className="absolute -right-0 top-6 w-8 h-8 bg-white rounded-full" />
                {/* Clock hands */}
                <View className="absolute top-8 right-2 w-1 h-4 bg-blue-600" />
                <View className="absolute top-8 right-2 w-3 h-1 bg-blue-600" />
              </View>

              <Text className="text-gray-800 font-quicksandBold text-lg text-center">
                Daily Reminders
              </Text>
              <Text className="text-gray-600 font-quicksandMedium text-sm text-center mt-1">
                Stay on track every day
              </Text>
            </View>
          </View>
        </View>

        {/* Header */}
        <View className="items-center mt-8">
          <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
            Daily Check-in
          </Text>
          <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
            Get a daily summary of your tasks{"\n"}and stay organized
          </Text>
        </View>

        {/* Settings Card */}
        <View className="mt-10">
          <View className="bg-white rounded-3xl p-6">
            {/* Enable/Disable */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-gray-800 font-quicksandBold text-lg">
                  Daily Reminder
                </Text>
                <Text className="text-gray-600 font-quicksandMedium text-sm mt-1">
                  Receive daily task summaries
                </Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: "#E5E7EB", true: "#FED7AA" }}
                thumbColor={dailyReminder ? "#EA580C" : "#9CA3AF"}
              />
            </View>

            {/* Time Selection */}
            {dailyReminder && (
              <View className="border-t border-gray-200 pt-6">
                <Text className="text-gray-800 font-quicksandBold text-lg mb-4">
                  Reminder Time
                </Text>

                <TouchableOpacity
                  onPress={showTimePicker}
                  className="bg-orange-50 p-4 rounded-2xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="time"
                      size={24}
                      color="#EA580C"
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className="text-gray-800 font-quicksandMedium text-base">
                        {formatTimeDisplay(reminderTime)}
                      </Text>
                      <Text className="text-gray-600 font-quicksandMedium text-sm">
                        Tap to change time
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Benefits */}
            <View className="mt-6 space-y-3">
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Daily task overview
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Never miss important deadlines
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Build consistent study habits
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing reserved for the pinned CTA */}
        <View className="h-10" />

        {/* CTA + skip */}
        <View className="mt-6">
          <TouchableOpacity
            className="bg-orange-600 h-16 rounded-full items-center justify-center"
            onPress={handleNext}
          >
            <Text className="text-white font-quicksandBold text-lg">
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text className="text-gray-500 font-quicksandMedium text-base">
              Skip for now
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
