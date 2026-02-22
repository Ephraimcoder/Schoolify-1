import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TimePickerModal from "../components/TimePickerModal";
import { useTheme } from "../context/ThemeContext";
import { database } from "../database/database";
import { useFadeAnimation } from "../hooks/useBackTransition";
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
  const { isDark, toggleTheme } = useTheme();
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(null);
  const [appVersion] = useState("1.0.0");
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const fadeAnim = useFadeAnimation();

  const minuteOptions = [5, 10, 15, 30, 60, 120];

  // Load backup preference from database
  const loadBackupPreference = async () => {
    try {
      const backupPrefs = database.collections.get("backup_prefs");
      const prefs = await backupPrefs.query().fetch();

      if (prefs.length > 0) {
        setBackupEnabled(prefs[0].enabled);
      } else {
        // Create default preference if none exists
        await database.write(async () => {
          await backupPrefs.create((pref) => {
            pref.enabled = true;
          });
        });
        setBackupEnabled(true);
      }
    } catch (error) {
      console.error("Error loading backup preference:", error);
      setBackupEnabled(true); // Default to enabled
    }
  };

  // Save backup preference to database
  const saveBackupPreference = async (enabled) => {
    try {
      const backupPrefs = database.collections.get("backup_prefs");
      const prefs = await backupPrefs.query().fetch();

      await database.write(async () => {
        if (prefs.length > 0) {
          // Update existing preference
          await prefs[0].update((pref) => {
            pref.enabled = enabled;
          });
        } else {
          // Create new preference record
          await backupPrefs.create((pref) => {
            pref.enabled = enabled;
          });
        }
      });

      showSuccess(`Backup ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error saving backup preference:", error);
    }
  };

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load all settings in parallel for better performance
        const [savedLeadMinutes, savedReminder] = await Promise.all([
          getNotificationLeadMinutes(),
          getScheduledReminder(),
        ]);

        // Load notification lead time
        if (savedLeadMinutes !== null && savedLeadMinutes !== undefined) {
          setLeadMinutes(savedLeadMinutes);
        } else {
          // Only use default if no saved preference exists
          // The onboarding should have already set this
          console.log("No saved notification lead time found, using default");
        }

        // Load daily reminder settings
        if (savedReminder) {
          setDailyReminder(true);
          setReminderTime(new Date());
          setReminderTime((prev) => {
            const newTime = new Date(prev || new Date());
            newTime.setHours(savedReminder.hour, savedReminder.minute, 0, 0);
            return newTime;
          });
        }

        // Load backup preference
        await loadBackupPreference();
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
          reminderTime.getMinutes(),
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
      selectedTime.getMinutes(),
    );

    if (success) {
      showSuccess(
        `Daily reminder set for ${formatTimeDisplay(selectedTime.getHours(), selectedTime.getMinutes())}`,
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
      className={`flex-row items-center justify-between py-4 px-5 border-b ${
        isDark ? "border-gray-700" : "border-gray-100"
      }`}
      disabled={!onPress}
    >
      <View className="flex-row items-center flex-1">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isDark ? "bg-indigo-900/30" : "bg-indigo-50"
          }`}
        >
          <Ionicons name={icon} size={20} color="#4F46E5" />
        </View>
        <View className="flex-1">
          <Text
            className={`font-quicksandBold text-base ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {title}
          </Text>
          {description && (
            <Text
              className={`font-quicksand text-sm mt-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightComponent ? (
        rightComponent
      ) : showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#9CA3AF" : "#9CA3AF"}
        />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          flex: 1,
        }}
      >
        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-5 py-4 border-b ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"
          }`}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#D1D5DB" : "#111827"}
            />
          </TouchableOpacity>
          <Text
            className={`text-lg font-quicksandBold ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* App Settings */}
          <View
            className={`rounded-xl mx-4 my-4 overflow-hidden ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              App Settings
            </Text>

            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              description="Toggle dark mode"
              rightComponent={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
                  thumbColor={isDark ? "#4F46E5" : "#F3F4F6"}
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
                    color={isDark ? "#9CA3AF" : "#9CA3AF"}
                  />
                </View>
              }
            />

            {showNotificationSettings && (
              <View
                className={`px-5 py-4 border-t ${
                  isDark ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <Text
                  className={`font-quicksand text-sm mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Remind me before a task starts:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {minuteOptions.map((m) => {
                    const selected = leadMinutes !== null && m === leadMinutes;
                    return (
                      <TouchableOpacity
                        key={m}
                        className={`px-4 py-2 rounded-full border ${
                          selected
                            ? "bg-indigo-100 border-indigo-300"
                            : isDark
                              ? "bg-gray-700 border-gray-600"
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
                            selected
                              ? "text-indigo-700"
                              : isDark
                                ? "text-gray-300"
                                : "text-gray-700"
                          }`}
                        >
                          {m} mins
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text
                  className={`font-quicksand mt-2 text-xs ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  This applies to new reminders you schedule for tasks.
                </Text>
              </View>
            )}
          </View>

          {/* Account */}
          <View
            className={`rounded-xl mx-4 my-4 overflow-hidden ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Account
            </Text>

            <SettingItem
              icon="cloud-upload-outline"
              title="Backup & Sync"
              description="Automatically back up your data"
              rightComponent={
                <Switch
                  value={backupEnabled}
                  onValueChange={(value) => {
                    setBackupEnabled(value);
                    saveBackupPreference(value);
                  }}
                  trackColor={{ false: "#E5E7EB", true: "#A5B4FC" }}
                  thumbColor={backupEnabled ? "#4F46E5" : "#F3F4F6"}
                />
              }
            />
          </View>

          {/* Support */}
          {/* <View
            className={`rounded-xl mx-4 my-4 overflow-hidden ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`font-quicksandBold text-xs uppercase tracking-wider px-5 pt-4 pb-2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
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
          </View> */}

          {/* App Info */}
          <View className="items-center py-6">
            <Text
              className={`font-quicksand text-sm ${
                isDark ? "text-gray-400" : "text-gray-400"
              }`}
            >
              Schoolify v{appVersion}
            </Text>
            <Text
              className={`font-quicksand text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {new Date().getFullYear()} Schoolify. All rights reserved.
            </Text>
          </View>
        </ScrollView>

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          initialTime={reminderTime || new Date()}
          onTimeSelected={handleTimeSelected}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default Settings;
