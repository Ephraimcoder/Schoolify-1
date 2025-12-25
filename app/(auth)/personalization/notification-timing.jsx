import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
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

export default function NotificationTiming() {
  const router = useRouter();
  const [leadMinutes, setLeadMinutes] = useState(15);
  const minuteOptions = [5, 10, 15, 30, 60, 120];

  const handleNext = () => {
    // TODO: Save to database
    console.log("Notification lead minutes:", leadMinutes);
    router.push("/(auth)/personalization/daily-reminder");
  };

  const handleSkip = () => {
    router.push("/(auth)/personalization/daily-reminder");
  };

  const formatTimeDisplay = (minutes) => {
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

              <Text className="text-gray-800 font-quicksandBold text-lg text-center">
                Smart Notifications
              </Text>
              <Text className="text-gray-600 font-quicksandMedium text-sm text-center mt-1">
                Get reminded at the perfect time
              </Text>
            </View>
          </View>
        </View>

        {/* Header */}
        <View className="items-center mt-8">
          <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
            When to Remind
          </Text>
          <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
            How early should we notify you{"\n"}before your tasks are due?
          </Text>
        </View>

        {/* Timing Options */}
        <View className="mt-10">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-gray-800 font-quicksandBold text-lg mb-4">
              Notification Timing
            </Text>

            <View className="space-y-3">
              {minuteOptions.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setLeadMinutes(minutes)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl ${
                    leadMinutes === minutes
                      ? "bg-orange-50 border-2 border-orange-500"
                      : "bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        leadMinutes === minutes
                          ? "bg-orange-500 border-orange-500"
                          : "bg-gray-300 border-gray-300"
                      }`}
                    >
                      {leadMinutes === minutes && (
                        <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                      )}
                    </View>
                    <Text
                      className={`font-quicksandMedium text-base ${
                        leadMinutes === minutes
                          ? "text-orange-600"
                          : "text-gray-700"
                      }`}
                    >
                      {formatTimeDisplay(minutes)}
                    </Text>
                  </View>
                  {minutes === 15 && (
                    <View className="bg-orange-100 px-2 py-1 rounded-full">
                      <Text className="text-orange-600 font-quicksandMedium text-xs">
                        Recommended
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Info note */}
            <View className="mt-6 bg-blue-50 p-4 rounded-2xl">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle"
                  size={20}
                  color="#3B82F6"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text className="text-blue-800 font-quicksandMedium text-sm flex-1">
                  We'll send you a notification before each task is due. You can
                  always change this later in settings.
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
              Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text className="text-gray-500 font-quicksandMedium text-base">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
