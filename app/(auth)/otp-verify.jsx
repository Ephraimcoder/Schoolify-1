import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpVerify() {
  const { userId, email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isOffline, setIsOffline] = useState(false);
  const timerRef = useRef(null);
  const { verifyEmailOtp, requestEmailOtp } = useUser();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.setItem("onboarding_seen", "true").catch(() => {});
  }, []);

  useEffect(() => {
    const init = async () => {
      const net = await NetInfo.fetch();
      setIsOffline(!net.isConnected);
    };
    init();
    const unsub = NetInfo.addEventListener((s) => setIsOffline(!s.isConnected));
    return () => unsub();
  }, []);

  useEffect(() => {
    // start cooldown timer on mount
    setCooldown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const onVerify = async () => {
    if (isOffline) {
      showWarning("You need to be online to verify.");
      return;
    }
    const trimmed = String(code).trim();
    if (trimmed.length !== 6) {
      showError("Enter the 6-digit code sent to your email");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmailOtp({ userId, code: trimmed });
      showSuccess("Signed in successfully");
      router.replace("/(tabs)/Home");
    } catch (error) {
      console.error("OTP verify error:", error);
      showError(error.message || "Invalid or expired code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (isOffline) {
      showWarning("You need to be online to resend.");
      return;
    }
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      // Reuse the same userId for consistency
      await requestEmailOtp(String(email), {
        phrase: false,
        userId: String(userId),
      });
      showSuccess("OTP resent to your email");
      // restart cooldown
      setCooldown(RESEND_COOLDOWN_SECONDS);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("OTP resend error:", error);
      showError(error.message || "Failed to resend OTP. Please try later.");
    } finally {
      setIsResending(false);
    }
  };

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

        {/* Hero */}
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
              You're currently offline. Some features may be limited.
            </Text>
          </View>
        )}

        {/* Header */}
        <View className="items-center mt-8">
          <Text className="text-5xl font-quicksandBold text-gray-900 text-center">
            Verify OTP
          </Text>
          <Text className="text-xl text-gray-600 text-center font-quicksandMedium mt-3 leading-6">
            Enter the 6-digit code sent to {String(email)}
          </Text>
        </View>

        {/* Code input */}
        <View className="mt-10 items-center">
          <TextInput
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            className="w-1/2 h-16 bg-white border-2 border-gray-300 rounded-3xl px-6 text-center text-gray-900 text-lg"
            placeholderTextColor="#9CA3AF"
            style={{ fontFamily: "Quicksand-Regular", letterSpacing: 6 }}
          />
        </View>

        {/* Resend */}
        <View className="items-center mt-4">
          <TouchableOpacity
            onPress={onResend}
            disabled={isResending || cooldown > 0}
          >
            <Text
              className={`font-quicksandBold ${cooldown > 0 ? "text-gray-400" : "text-orange-600"}`}
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : isResending
                  ? "Resending..."
                  : "Resend code"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute left-6 right-6 bottom-6">
        <TouchableOpacity
          className="bg-orange-600 h-16 rounded-full items-center justify-center"
          onPress={onVerify}
          disabled={isSubmitting}
        >
          <Text className="text-white font-quicksandBold text-lg">
            {isSubmitting ? "Verifying..." : "Verify & Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
