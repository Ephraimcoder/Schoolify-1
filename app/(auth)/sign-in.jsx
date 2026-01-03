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
import { useUser } from "../../context/UserContext";
import { showError, showSuccess, showWarning } from "../../utils/toast";
import ScreenAnimation from "../../components/ScreenAnimation";
export default function SignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Mark onboarding as seen as soon as user hits any auth screen
    AsyncStorage.setItem("onboarding_seen", "true").catch(() => {});
  }, []);

  useEffect(() => {
    // Check if we're offline from the router params
    if (params.offline === "true") {
      setIsOffline(true);
    }

    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, [params]);

  const submit = async () => {
    if (isOffline) {
      showWarning("You need to be online to sign in.");
      return;
    }

    const { email, password } = form;
    if (!form.email || !form.password) {
      showError("Please enter a valid email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      showSuccess("User signed in successfully");
      router.replace("/(tabs)/Home");
    } catch (error) {
      console.error("Sign in error:", error);
      showError(
        error.message ||
          "Failed to sign in. Please check your credentials and try again."
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
      <View className="flex-1 bg-amber-50">
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

          {/* Illustration style hero card */}
          <View className="items-center mt-6">
            <View
              className="w-11/12 h-44 bg-white rounded-3xl items-center justify-center"
              style={[cardShadow]}
            >
              <View className="items-center">
                {/* Book illustration */}
                <View className="relative mb-4">
                  <View className="w-16 h-12 bg-orange-500 rounded-lg shadow-md" />
                  <View className="absolute top-1 left-1 w-14 h-10 bg-orange-600 rounded-lg" />
                  <View className="absolute top-2 left-2 w-12 h-8 bg-white rounded" />
                  <View className="absolute top-3 left-3 w-10 h-1 bg-orange-200 rounded" />
                  <View className="absolute top-5 left-3 w-8 h-1 bg-orange-200 rounded" />
                  <View className="absolute top-7 left-3 w-9 h-1 bg-orange-200 rounded" />
                </View>

                <Text className="text-gray-800 font-quicksandBold text-lg text-center">
                  Welcome Back!
                </Text>
                <Text className="text-gray-600 font-quicksandMedium text-sm text-center mt-1">
                  Continue your learning journey
                </Text>
              </View>
            </View>
          </View>

          {/* Offline Banner */}
          {isOffline && (
            <View className="bg-yellow-100 p-3 rounded-lg mt-6 border-l-4 border-yellow-500">
              <Text
                className="text-yellow-800"
                style={{ fontFamily: "Quicksand-Medium" }}
              >
                You're currently offline. Some features may be limited.
              </Text>
            </View>
          )}

          {/* Header */}
          <View className="items-center mt-8">
            <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
              Login
            </Text>
            <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
              Hey, Enter your details to get sign in{"\n"}to your account
            </Text>
          </View>

          {/* Form */}
          <View className="mt-10">
            <View className="mb-5">
              <TextInput
                placeholder="Enter Email / Phone No"
                value={form.email}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
                className="w-full h-16 bg-white border-2 border-gray-300 rounded-3xl px-6 text-gray-900 text-lg"
                placeholderTextColor="#9CA3AF"
                style={{ fontFamily: "Quicksand-Regular" }}
              />
            </View>

            <View className="mb-4">
              <View className="relative">
                <TextInput
                  placeholder="Password"
                  value={form.password}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, password: text }))
                  }
                  secureTextEntry={!showPassword}
                  className="w-full h-16 bg-white border-2 border-gray-300 rounded-3xl px-6 text-gray-900 text-lg pr-14"
                  placeholderTextColor="#9CA3AF"
                  style={{ fontFamily: "Quicksand-Regular" }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-16 w-14 items-center justify-center"
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom spacing reserved for the pinned CTA */}
          <View className="h-10" />

          {/* CTA + links */}
          <View className="mt-6">
            <TouchableOpacity
              className="bg-orange-600 h-16 rounded-full items-center justify-center"
              onPress={submit}
              disabled={isSubmitting}
            >
              <Text className="text-white font-quicksandBold text-lg">
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-3">
              <Link
                href="/(auth)/otp-start"
                className="text-orange-500 font-quicksandBold text-base"
                style={{ fontFamily: "Quicksand-Regular" }}
              >
                Use Email OTP instead
              </Link>
            </View>

            <View className="flex-row justify-center mt-2">
              <Text
                className="text-gray-600 text-base"
                style={{ fontFamily: "Quicksand-Regular" }}
              >
                Don't have an account?{" "}
              </Text>
              <Link
                href="/(auth)/sign-up"
                className="text-orange-500 font-quicksandBold text-base"
                style={{ fontFamily: "Quicksand-Regular" }}
              >
                Sign Up
              </Link>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenAnimation>
  );
}
