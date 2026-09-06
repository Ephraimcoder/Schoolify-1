import { Ionicons } from "@expo/vector-icons";
import { useDatabase } from "@nozbe/watermelondb/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import {
  getNotificationLeadMinutes,
  setNotificationLeadMinutes,
} from "../../../utils/notificationPrefs";
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

export default function NotificationTiming() {
  const router = useRouter();
  const database = useDatabase();
  const [leadMinutes, setLeadMinutes] = useState(15);
  const minuteOptions = [0, 5, 10, 15, 30, 60, 120];
  const { isDark, colors } = useTheme();

  // Load saved notification preference on mount
  useEffect(() => {
    const loadSavedPreference = async () => {
      try {
        const savedMinutes = await getNotificationLeadMinutes();
        if (savedMinutes !== null && savedMinutes !== undefined) {
          setLeadMinutes(savedMinutes);
        }
      } catch (error) {
        console.error("Error loading notification preference:", error);
        // Keep default if load fails
      }
    };
    loadSavedPreference();
  }, []);

  const handleNext = async () => {
    try {
      await setNotificationLeadMinutes(leadMinutes);
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error saving notification preference:", error);
      // Still proceed even if database save fails
      router.replace("/(auth)/sign-in");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/sign-in");
  };

  const formatTimeDisplay = (minutes) => {
    if (minutes === 0) {
      return "At due time";
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} before`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? "s" : ""} before`;
      } else {
        return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} min before`;
      }
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
            Scholar Flow<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        {/* Hero card with illustration */}
        <View className="items-center mt-6">
          <View
            className="w-11/12 h-44 rounded-3xl items-center justify-center overflow-hidden"
            style={[cardShadow, { backgroundColor: colors.card }]}
          >
            {/* Bell illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Bell shape */}
                <View className="w-16 h-16 bg-orange-500 rounded-full" />
                <View className="absolute top-2 left-2 w-12 h-12 bg-orange-600 rounded-full" />
                <View className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full" />
                {/* Bell clapper */}
                <View className="absolute bottom-0 left-7 w-2 h-4 bg-orange-700 rounded-full" />
                {/* Notification waves */}
                <View className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-orange-400" />
                <View className="absolute -top-4 -right-4 w-10 h-10 rounded-full border-2 border-orange-300" />
              </View>

              <Text
                className="font-quicksandBold text-lg text-center"
                style={{ color: colors.text }}
              >
                Smart Notifications
              </Text>
              <Text
                className="font-quicksandMedium text-sm text-center mt-1"
                style={{ color: colors.textSecondary }}
              >
                Get reminded at perfect time
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
            Heads-Up Time
          </Text>
          <Text
            className="text-xl text-center font-quicksandMedium mt-3 leading-6"
            style={{ color: colors.textSecondary }}
          >
            How much warning do you need before things are due?
          </Text>
        </View>

        {/* Timing Options */}
        <View className="mt-10">
          <View
            className="rounded-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              className="font-quicksandBold text-lg mb-4"
              style={{ color: colors.text }}
            >
              Notification Timing
            </Text>

            <View className="space-y-3">
              {minuteOptions.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setLeadMinutes(minutes)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl ${
                    leadMinutes === minutes ? "border-2" : "border-2"
                  }`}
                  style={{
                    backgroundColor:
                      leadMinutes === minutes
                        ? `${colors.primary}20`
                        : `${colors.gray}20`,
                    borderColor:
                      leadMinutes === minutes ? colors.primary : "transparent",
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        leadMinutes === minutes
                          ? "border-orange-500"
                          : "border-gray-300"
                      }`}
                      style={{
                        backgroundColor:
                          leadMinutes === minutes
                            ? colors.primary
                            : colors.gray,
                      }}
                    >
                      {leadMinutes === minutes && (
                        <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                      )}
                    </View>
                    <Text
                      className="font-quicksandMedium text-base"
                      style={{
                        color:
                          leadMinutes === minutes
                            ? colors.primary
                            : colors.text,
                      }}
                    >
                      {formatTimeDisplay(minutes)}
                    </Text>
                  </View>
                  {minutes === 15 && (
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Text
                        className="font-quicksandMedium text-xs"
                        style={{ color: colors.primary }}
                      >
                        Recommended
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Info note */}
            <View
              className="mt-6 p-4 rounded-2xl"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text
                  className="font-quicksandMedium text-sm flex-1"
                  style={{ color: colors.text }}
                >
                  We'll send you a notification before each task is due, or
                  exactly when it's due. You can always change this later in
                  settings.
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
              All set! Let's go
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text
              className="font-quicksandMedium text-base"
              style={{ color: colors.textSecondary }}
            >
              I'll set this up later
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
