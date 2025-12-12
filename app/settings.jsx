import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TimePickerModal from "../components/TimePickerModal";
import {
  cancelDailyReminder,
  formatTimeDisplay,
  getScheduledReminder,
  scheduleDailyReminder,
} from "../utils/dailyReminder";
import {
  getNotificationLeadMinutes,
  setNotificationLeadMinutes,
} from "../utils/notificationPrefs";
import { showSuccess } from "../utils/toast";

const Settings = () => {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(15);
  const [appVersion] = useState("1.0.0");
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);

  const minuteOptions = [5, 10, 15, 30, 60, 120];

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load notification lead time
        const savedLeadMinutes = await getNotificationLeadMinutes();
        if (savedLeadMinutes) {
          setLeadMinutes(savedLeadMinutes);
        }

        // Load daily reminder settings
        const savedReminder = await getScheduledReminder();
        if (savedReminder) {
          setDailyReminder(true);
          setReminderTime(new Date());
          setReminderTime((prev) => {
            const newTime = new Date(prev || new Date());
            newTime.setHours(savedReminder.hour, savedReminder.minute, 0, 0);
            return newTime;
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleDailyReminderToggle = async (value) => {
    setDailyReminder(value);
    if (value) {
      // If enabling but no time is set, show time picker
      if (!reminderTime) {
        setShowTimePicker(true);
      } else {
        // If time is already set, schedule the reminder
        await scheduleDailyReminder(
          reminderTime.getHours(),
          reminderTime.getMinutes()
        );
        showSuccess("Daily reminder enabled");
      }
    } else {
      // If disabling, cancel the reminder
      await cancelDailyReminder();
      showSuccess("Daily reminder disabled");
    }
  };

  const handleTimeSelected = async (selectedTime) => {
    setReminderTime(selectedTime);
    setShowTimePicker(false);

    // Enable the daily reminder when a time is selected
    if (!dailyReminder) {
      setDailyReminder(true);
    }

    // Schedule the reminder with the new time
    const success = await scheduleDailyReminder(
      selectedTime.getHours(),
      selectedTime.getMinutes()
    );

    if (success) {
      showSuccess(
        `Daily reminder set for ${formatTimeDisplay(selectedTime.getHours(), selectedTime.getMinutes())}`
      );
    }
  };

  const SettingItem = ({
    icon,
    title,
    description,
    onPress,
    showChevron = true,
    rightComponent,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-5 border-b border-gray-100"
      disabled={!onPress}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mr-3">
          <Ionicons name={icon} size={20} color="#4F46E5" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-quicksandBold text-base">
            {title}
          </Text>
          {description && (
            <Text className="text-gray-500 font-quicksand text-sm mt-1">
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightComponent ? (
        rightComponent
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-quicksandBold text-gray-900">
          Settings
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <View className="bg-white rounded-xl mx-4 my-4 overflow-hidden">
          <Text className="text-gray-500 font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2">
            App Settings
          </Text>

          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
                thumbColor={darkMode ? "#4F46E5" : "#F3F4F6"}
              />
            }
          />

          <SettingItem
            icon="alarm-outline"
            title="Daily Reminder"
            description={
              dailyReminder && reminderTime
                ? `Daily at ${formatTimeDisplay(reminderTime.getHours(), reminderTime.getMinutes())}`
                : "Get reminded to use the app daily"
            }
            onPress={() => setShowTimePicker(true)}
            rightComponent={
              <Switch
                value={dailyReminder}
                onValueChange={handleDailyReminderToggle}
                trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
                thumbColor={dailyReminder ? "#4F46E5" : "#F3F4F6"}
              />
            }
          />

          <SettingItem
            icon="notifications-outline"
            title="Notification Settings"
            onPress={() =>
              setShowNotificationSettings(!showNotificationSettings)
            }
            rightComponent={
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    showNotificationSettings ? "chevron-up" : "chevron-down"
                  }
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            }
          />

          {showNotificationSettings && (
            <View className="px-5 py-4 border-t border-gray-100">
              <Text className="text-gray-500 font-quicksand text-sm mb-3">
                Remind me before a task starts:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {minuteOptions.map((m) => {
                  const selected = m === leadMinutes;
                  return (
                    <TouchableOpacity
                      key={m}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-indigo-100 border-indigo-300"
                          : "bg-white border-gray-200"
                      }`}
                      onPress={async () => {
                        setLeadMinutes(m);
                        await setNotificationLeadMinutes(m);
                        showSuccess(`Reminder set to ${m} minutes before`);
                      }}
                    >
                      <Text
                        className={`font-quicksand text-sm ${
                          selected ? "text-indigo-700" : "text-gray-700"
                        }`}
                      >
                        {m} mins
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-gray-400 font-quicksand mt-2 text-xs">
                This applies to new reminders you schedule for tasks.
              </Text>
            </View>
          )}
        </View>

        {/* Account */}
        <View className="bg-white rounded-xl mx-4 my-4 overflow-hidden">
          <Text className="text-gray-500 font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2">
            Account
          </Text>

          <SettingItem
            icon="cloud-upload-outline"
            title="Backup & Sync"
            description="Automatically back up your data"
            rightComponent={
              <Switch
                value={backupEnabled}
                onValueChange={setBackupEnabled}
                trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
                thumbColor={backupEnabled ? "#4F46E5" : "#F3F4F6"}
              />
            }
          />
        </View>

        {/* Support */}
        <View className="bg-white rounded-xl mx-4 my-4 overflow-hidden">
          <Text className="text-gray-500 font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2">
            Support
          </Text>

          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />

          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />

          <SettingItem
            icon="star-outline"
            title="Rate the App"
            onPress={() => {}}
          />
        </View>

        {/* App Info */}
        <View className="items-center py-6">
          <Text className="text-gray-400 font-quicksand text-sm">
            Schoolify v{appVersion}
          </Text>
          <Text className="text-gray-400 font-quicksand text-xs mt-1">
            {new Date().getFullYear()} Schoolify. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelected={handleTimeSelected}
        initialTime={reminderTime || new Date()}
      />
    </SafeAreaView>
  );
};

export default Settings;
