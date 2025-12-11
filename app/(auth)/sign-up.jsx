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

export default function SignUp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const { register } = useUser();
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
      await register(email, password, name);
      showSuccess("Account created successfully!");
      router.replace("/(tabs)/Home");
    } catch (error) {
      console.error("Registration error:", error);
      showError(error.message || "Failed to create account. Please try again.");
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
    <View className="flex-1 bg-amber-50">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 200,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View className="items-center">
          <Text className="text-2xl font-quicksandBold">
            Schoolify<Text className="text-orange-600">.</Text>
          </Text>
        </View>

        {/* Optional hero placeholder to echo onboarding style */}
        <View className="items-center mt-6">
          <View
            className="w-11/12 h-44 bg-white rounded-3xl items-center justify-center"
            style={[cardShadow]}
          >
            <View className="w-14 h-14 rounded-full bg-orange-200" />
          </View>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View className="bg-yellow-100 p-3 rounded-lg mt-6 border-l-4 border-yellow-500">
            <Text
              className="text-yellow-800"
              style={{ fontFamily: "Quicksand-Medium" }}
            >
              You're currently offline. You need to be online to create an
              account.
            </Text>
          </View>
        )}

        {/* Header */}
        <View className="items-center mt-8">
          <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
            Create Account 👋
          </Text>
          <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
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
              className="w-full h-16 bg-white border-2 border-gray-300 rounded-3xl px-6 text-gray-900 text-lg"
              placeholderTextColor="#9CA3AF"
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
              className="w-full h-16 bg-white border-2 border-gray-300 rounded-3xl px-6 text-gray-900 text-lg"
              placeholderTextColor="#9CA3AF"
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

        {/* Bottom spacer for pinned CTA */}
        <View className="h-10" />
      </ScrollView>

      {/* Pinned bottom CTA + link */}
      <View className="absolute left-6 right-6 bottom-6">
        <TouchableOpacity
          className="bg-orange-600 h-16 rounded-full items-center justify-center"
          onPress={submit}
          disabled={isSubmitting}
        >
          <Text className="text-white font-quicksandBold text-lg">
            {isSubmitting ? "Creating Account..." : "Continue"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-3">
          <Text
            className="text-gray-600 text-base"
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
    </View>
  );
}
