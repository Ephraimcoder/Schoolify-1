import { Ionicons } from "@expo/vector-icons";
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

export default function BackupSettings() {
  const router = useRouter();
  const [backupEnabled, setBackupEnabled] = useState(true);

  const handleNext = () => {
    // TODO: Save to database
    console.log("Backup enabled:", backupEnabled);
    router.push("/(auth)/personalization/notification-timing");
  };

  const handleSkip = () => {
    router.push("/(auth)/personalization/notification-timing");
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
            {/* Cloud backup illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Cloud shape */}
                <View className="w-20 h-12 bg-blue-400 rounded-full" />
                <View className="absolute -top-2 left-4 w-12 h-12 bg-blue-400 rounded-full" />
                <View className="absolute -top-2 right-4 w-10 h-10 bg-blue-400 rounded-full" />
                {/* Upload arrows */}
                <View className="absolute top-6 left-8">
                  <Ionicons name="cloud-upload" size={32} color="white" />
                </View>
              </View>

              <Text className="text-gray-800 font-quicksandBold text-lg text-center">
                Backup Your Data
              </Text>
              <Text className="text-gray-600 font-quicksandMedium text-sm text-center mt-1">
                Never lose your tasks and progress
              </Text>
            </View>
          </View>
        </View>

        {/* Header */}
        <View className="items-center mt-8">
          <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
            Auto Backup
          </Text>
          <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
            Keep your data safe with automatic{"\n"}cloud backups
          </Text>
        </View>

        {/* Settings Card */}
        <View className="mt-10">
          <View className="bg-white rounded-3xl p-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-800 font-quicksandBold text-lg">
                  Enable Auto Backup
                </Text>
                <Text className="text-gray-600 font-quicksandMedium text-sm mt-1">
                  Automatically save your tasks to the cloud
                </Text>
              </View>
              <Switch
                value={backupEnabled}
                onValueChange={setBackupEnabled}
                trackColor={{ false: "#E5E7EB", true: "#FED7AA" }}
                thumbColor={backupEnabled ? "#EA580C" : "#9CA3AF"}
              />
            </View>

            {/* Benefits */}
            <View className="mt-6 space-y-3">
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Restore data on any device
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Never lose your progress
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#16A34A" />
                </View>
                <Text className="text-gray-700 font-quicksandMedium text-sm">
                  Sync across all your devices
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
