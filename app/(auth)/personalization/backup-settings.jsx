import { Ionicons } from "@expo/vector-icons";
import { useDatabase } from "@nozbe/watermelondb/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { showSuccess } from "../../../utils/toast";
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

export default function BackupSettings() {
  const router = useRouter();
  const database = useDatabase();
  const [backupEnabled, setBackupEnabled] = useState(true);
  const { isDark, colors } = useTheme();

  // Load backup preference on mount
  useEffect(() => {
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

    loadBackupPreference();
  }, [database]);

  const handleNext = async () => {
    try {
      // Save backup preference to database
      const backupPrefs = database.collections.get("backup_prefs");
      const existingPrefs = await backupPrefs.query().fetch();

      await database.write(async () => {
        if (existingPrefs.length > 0) {
          // Update existing preference
          await existingPrefs[0].update((pref) => {
            pref.enabled = backupEnabled;
          });
        } else {
          // Create new preference record
          await backupPrefs.create((pref) => {
            pref.enabled = backupEnabled;
          });
        }
      });

      // Backup enabled saved to database: ${backupEnabled}
      showSuccess(`Backup ${backupEnabled ? "enabled" : "disabled"}`);
      router.push("/(auth)/personalization/notification-timing");
    } catch (error) {
      console.error("Error saving backup preference:", error);
      // Still proceed even if database save fails
      router.push("/(auth)/personalization/notification-timing");
    }
  };

  const handleSkip = () => {
    router.push("/(auth)/personalization/notification-timing");
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
            {/* Cloud backup illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Shield with cloud */}
                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                    <Ionicons name="cloud" size={24} color="white" />
                  </View>
                  {/* Shield effect */}
                  <View className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full" />
                </View>
              </View>

              <Text
                className="font-quicksandBold text-lg text-center"
                style={{ color: colors.text }}
              >
                Peace of Mind
              </Text>
              <Text
                className="font-quicksandMedium text-sm text-center mt-1"
                style={{ color: colors.textSecondary }}
              >
                Your data is always safe
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
            Safe & Sound
          </Text>
          <Text
            className="text-xl text-center font-quicksandMedium mt-3 leading-6"
            style={{ color: colors.textSecondary }}
          >
            Your tasks, automatically backed up
          </Text>
        </View>

        {/* Settings Card */}
        <View className="mt-10">
          <View
            className="rounded-3xl p-8"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="font-quicksandBold text-lg"
                  style={{ color: colors.text }}
                >
                  Auto Backup
                </Text>
                <Text
                  className="font-quicksandMedium text-sm mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Keep your tasks safe in the cloud
                </Text>
              </View>
              <Switch
                value={backupEnabled}
                onValueChange={setBackupEnabled}
                trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                thumbColor={backupEnabled ? "#059669" : "#9CA3AF"}
                key={`backup-enabled-${backupEnabled}`}
              />
            </View>

            {/* Benefits */}
            <View className="mt-8 space-y-5 gap-2">
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm flex-1"
                  style={{ color: colors.text, lineHeight: 20 }}
                >
                  Never lose your progress
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="sync" size={16} color="#2563EB" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm flex-1"
                  style={{ color: colors.text, lineHeight: 20 }}
                >
                  Access from any device
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-4">
                  <Ionicons name="lock-closed" size={16} color="#7C3AED" />
                </View>
                <Text
                  className="font-quicksandMedium text-sm flex-1"
                  style={{ color: colors.text, lineHeight: 20 }}
                >
                  Secure & private
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
              Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text
              className="font-quicksandMedium text-base"
              style={{ color: colors.textSecondary }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
