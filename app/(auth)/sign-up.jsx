import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenAnimation from "../../components/ScreenAnimation";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { showError, showSuccess, showWarning } from "../../utils/toast";
export default function SignUp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const { register, requestEmailOtp } = useUser();
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Mark onboarding as seen as soon as user hits any auth screen
    AsyncStorage.setItem("onboarding_seen", "true").catch(() => {});
  }, []);

  useEffect(() => {
    // Check initial network status
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };

    checkNetworkStatus();

    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const submit = async () => {
    if (isOffline) {
      showWarning("You need to be online to create an account.");
      return;
    }

    const { name, email, password } = form;

    if (!name || !email || !password) {
      showError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await requestEmailOtp(email, { isSignup: true });
      showSuccess("Verification code sent to your email!");

      // Navigate to OTP verification with signup data
      router.push({
        pathname: "/(auth)/otp-verify",
        params: {
          userId: response.userId,
          email: email,
          isSignup: "true",
          name: name,
          password: password,
        },
      });
    } catch (error) {
      console.error("OTP request error:", error);
      showError(
        error.message || "Failed to send verification code. Please try again."
      );
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
    <ScreenAnimation duration={400}>
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-gray-900" : "bg-amber-50"}`}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 40,
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
              Schoolify<Text className="text-orange-600">.</Text>
            </Text>
          </View>

          {/* Illustration style hero card */}
          <View className="items-center mt-6">
            <View
              className={`w-11/12 h-44 rounded-3xl items-center justify-center ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
              style={[cardShadow]}
            >
              <View className="items-center">
                {/* Graduation cap illustration */}
                <View className="relative mb-4">
                  {/* Cap base */}
                  <View className="w-16 h-10 bg-orange-600 rounded-t-full" />
                  {/* Cap top */}
                  <View className="absolute -top-2 left-0 w-16 h-4 bg-orange-700 rounded-t-lg" />
                  {/* Tassel */}
                  <View className="absolute top-0 right-2 w-1 h-8 bg-orange-800" />
                  <View className="absolute top-6 right-1 w-3 h-3 bg-orange-500 rounded-full" />
                  {/* Board */}
                  <View className="absolute -top-4 left-6 w-4 h-8 bg-orange-600 rounded" />
                </View>

                <Text
                  className={`font-quicksandBold text-lg text-center ${
                    isDark ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Start Your Journey!
                </Text>
                <Text
                  className={`font-quicksandMedium text-sm text-center mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Create your account and begin learning
                </Text>
              </View>
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
                You're currently offline. You need to be online to create an
                account.
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
              Create Account
            </Text>
            <Text
              className={`text-xl text-center font-quicksandMedium mt-3 leading-6 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Please register on our app, to {"\n"}continue using our service.
            </Text>
          </View>

          {/* Form */}
          <View className="mt-10">
            <View className="mb-5">
              <TextInput
                placeholder="Full Name"
                value={form.name}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, name: text }))
                }
                className={`w-full h-16 border-2 rounded-3xl px-6 text-lg ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                style={{ fontFamily: "Quicksand-Regular" }}
              />
            </View>

            <View className="mb-5">
              <TextInput
                placeholder="Email"
                value={form.email}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
                className={`w-full h-16 border-2 rounded-3xl px-6 text-lg ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                style={{ fontFamily: "Quicksand-Regular" }}
              />
            </View>

            <View className="mb-4">
              <TextInput
                placeholder="Password"
                value={form.password}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, password: text }))
                }
                secureTextEntry={!showPassword}
                className={`w-full h-16 border-2 rounded-3xl px-6 text-lg pr-14 ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                style={{ fontFamily: "Quicksand-Regular" }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-16 w-14 items-center justify-center"
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA + link */}
          <View className="mt-8">
            <TouchableOpacity
              className="bg-purple-600 h-16 rounded-full items-center justify-center"
              onPress={submit}
              disabled={isSubmitting}
            >
              <Text className="text-white font-quicksandBold text-lg">
                {isSubmitting ? "Sending Code..." : "Send Verification Code"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text
                className={`text-base ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
                style={{ fontFamily: "Quicksand-Regular" }}
              >
                Already have an account?{" "}
              </Text>
              <Link
                href="/(auth)/sign-in"
                className="text-orange-500 font-quicksandBold text-base"
                style={{ fontFamily: "Quicksand-Regular" }}
              >
                Sign in instead
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenAnimation>
  );
}
