import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { showError, showSuccess, showWarning } from "../../utils/toast";

export default function OtpStart() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();
  const { requestEmailOtp } = useUser();

  useEffect(() => {
    // Mark onboarding as seen as soon as user hits any auth screen
    AsyncStorage.setItem("onboarding_seen", "true").catch(() => {});
  }, []);

  useEffect(() => {
    // Check initial network status and subscribe
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };
    checkNetworkStatus();
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const submit = async () => {
    if (isOffline) {
      showWarning("You need to be online to request an OTP.");
      return;
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !emailTrimmed.includes("@")) {
      showError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { userId } = await requestEmailOtp(emailTrimmed, { phrase: false });
      showSuccess("OTP sent to your email");
      router.push({
        pathname: "/(auth)/otp-verify",
        params: { userId, email: emailTrimmed },
      });
    } catch (error) {
      console.error("OTP request error:", error);
      showError(error.message || "Failed to request OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-amber-50"}`}>
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
            className={`text-2xl font-quicksandBold ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Scholar Flow<Text className="text-orange-600">.</Text>
          </Text>
        </View>

        {/* Hero */}
        <View className="items-center mt-6">
          <View
            className={`w-11/12 h-44 rounded-3xl items-center justify-center ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
            style={[cardShadow]}
          >
            <View
              className={`w-14 h-14 rounded-full ${
                isDark ? "bg-orange-800" : "bg-orange-200"
              }`}
            />
          </View>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View
            className={`p-3 rounded-lg mt-6 border-l-4 ${
              isDark
                ? "bg-yellow-900/20 border-yellow-600"
                : "bg-yellow-100 border-yellow-500"
            }`}
          >
            <Text
              className={`${isDark ? "text-yellow-300" : "text-yellow-800"}`}
              style={{ fontFamily: "Quicksand-Medium" }}
            >
              You're currently offline. Some features may be limited.
            </Text>
          </View>
        )}

        {/* Header */}
        <View className="items-center mt-8">
          <Text
            className={`text-5xl font-quicksandBold text-center ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Email OTP
          </Text>
          <Text
            className={`text-xl text-center font-quicksandMedium mt-3 leading-6 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Enter your email to receive a 6-digit OTP
          </Text>
        </View>

        {/* Form */}
        <View className="mt-10">
          <View className="mb-5">
            <TextInput
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className={`w-full h-16 border-2 rounded-3xl px-6 text-lg ${
                isDark
                  ? "bg-gray-800 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              style={{ fontFamily: "Quicksand-Regular" }}
            />
          </View>
        </View>

        {/* Spacer */}
        <View className="h-10" />
      </ScrollView>

      {/* Pinned bottom CTA + link back */}
      <View className="absolute left-6 right-6 bottom-6">
        <TouchableOpacity
          className="bg-purple-600 h-16 rounded-full items-center justify-center"
          onPress={submit}
          disabled={isSubmitting}
        >
          <Text className="text-white font-quicksandBold text-lg">
            {isSubmitting ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-3">
          <Text
            className={`text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
            style={{ fontFamily: "Quicksand-Regular" }}
          >
            Prefer password login?{" "}
          </Text>
          <Link
            href="/(auth)/sign-in"
            className="text-orange-500 font-quicksandBold text-base"
            style={{ fontFamily: "Quicksand-Regular" }}
          >
            Go back
          </Link>
        </View>
      </View>
    </View>
  );
}
