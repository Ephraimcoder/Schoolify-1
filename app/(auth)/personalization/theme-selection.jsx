import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
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

// UI-only: subtle shadow styling for cards
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

export default function ThemeSelection() {
  const router = useRouter();
  const { isDark, toggleTheme, colors } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(isDark ? "dark" : "light");

  const themeOptions = [
    {
      id: "light",
      name: "Light",
      description: "Clean and bright interface",
      icon: "sunny",
      iconColor: "#F59E0B",
      preview: {
        background: "#FFFBF5",
        card: "#FFFFFF",
        text: "#1F2937",
        border: "#E5E7EB",
      },
    },
    {
      id: "dark",
      name: "Dark",
      description: "Easy on the eyes, perfect for night",
      icon: "moon",
      iconColor: "#6366F1",
      preview: {
        background: "#1F2937",
        card: "#374151",
        text: "#F9FAFB",
        border: "#4B5563",
      },
    },
  ];

  const handleThemeSelect = async (themeId) => {
    setSelectedTheme(themeId);

    // Apply selected theme immediately
    const shouldBeDark = themeId === "dark";
    if (shouldBeDark !== isDark) {
      // Wrap in setTimeout to avoid render-time state update
      setTimeout(() => {
        toggleTheme();
      }, 0);
    }
    try {
      await AsyncStorage.setItem("theme_preference", themeId);
      await AsyncStorage.setItem("theme", themeId);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const handleNext = () => {
    router.push("/(auth)/personalization/daily-reminder");
  };

  const handleSkip = () => {
    router.push("/(auth)/personalization/daily-reminder");
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
            {/* Theme illustration */}
            <View className="items-center">
              <View className="relative mb-4">
                {/* Sun and moon icons */}
                <View className="flex-row space-x-4">
                  <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center">
                    <Ionicons name="sunny" size={24} color="#F59E0B" />
                  </View>
                  <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center">
                    <Ionicons name="moon" size={24} color="#6366F1" />
                  </View>
                </View>
              </View>

              <Text
                className="font-quicksandBold text-lg text-center"
                style={{ color: colors.text }}
              >
                Choose Your Theme
              </Text>
              <Text
                className="font-quicksandMedium text-sm text-center mt-1"
                style={{ color: colors.textSecondary }}
              >
                Personalize your visual experience
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
            Pick Your Vibe
          </Text>
          <Text
            className="text-xl text-center font-quicksandMedium mt-3 leading-6"
            style={{ color: colors.textSecondary }}
          >
            Choose the look that feels right for you
          </Text>
        </View>

        {/* Theme Options */}
        <View className="mt-10 space-y-6">
          {themeOptions.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => handleThemeSelect(theme.id)}
              className="rounded-3xl p-6"
              style={[
                cardShadow,
                {
                  backgroundColor: colors.card,
                  borderWidth: selectedTheme === theme.id ? 2 : 0,
                  borderColor:
                    selectedTheme === theme.id ? colors.primary : "transparent",
                },
              ]}
            >
              <View className="flex-row items-center">
                {/* Theme icon */}
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${theme.iconColor}20` }}
                >
                  <Ionicons
                    name={theme.icon}
                    size={24}
                    color={theme.iconColor}
                  />
                </View>

                {/* Theme info */}
                <View className="flex-1">
                  <Text
                    className="font-quicksandBold text-lg"
                    style={{ color: colors.text }}
                  >
                    {theme.name}
                  </Text>
                  <Text
                    className="font-quicksandMedium text-sm mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {theme.description}
                  </Text>
                </View>

                {/* Selection indicator */}
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{ borderColor: colors.border }}
                >
                  {selectedTheme === theme.id && (
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </View>
              </View>

              {/* Mini preview */}
              <View className="mt-4 flex-row justify-center">
                <View
                  className="w-24 h-16 rounded-lg border"
                  style={{
                    backgroundColor: theme.preview.background,
                    borderColor: theme.preview.border,
                  }}
                >
                  <View className="flex-1 p-2">
                    <View
                      className="w-8 h-3 rounded mb-1"
                      style={{ backgroundColor: theme.preview.card }}
                    />
                    <View
                      className="w-16 h-2 rounded"
                      style={{
                        backgroundColor: theme.preview.text,
                        opacity: 0.7,
                      }}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing reserved for pinned CTA */}
        <View className="h-10" />

        {/* CTA */}
        <View className="mt-6">
          <TouchableOpacity
            className="h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleNext}
          >
            <Text className="text-white font-quicksandBold text-lg">
              Looks good! Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="mt-3 items-center">
            <Text
              className="font-quicksandMedium text-base"
              style={{ color: colors.textSecondary }}
            >
              I'll decide later
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
