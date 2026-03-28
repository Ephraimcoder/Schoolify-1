import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onboarding } from "../../constants/index";
import { useTheme } from "../../context/ThemeContext";
const { width } = Dimensions.get("window");

export default function Index() {
  const scrollViewRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentSlide < onboarding.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: width * nextSlide, animated: true });
    } else {
      // Finished onboarding, go to quick personalization
      try {
        await AsyncStorage.setItem("onboarding_seen", "true");
      } catch {}
      router.replace("/(auth)/personalization/theme-selection");
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem("onboarding_seen", "true");
    } catch {}
    router.replace("/(auth)/sign-in");
  };

  useEffect(() => {
    let mounted = true;
    const checkOnboardingSeen = async () => {
      try {
        // Check if user is already logged in first
        const cachedUser = await AsyncStorage.getItem("@user_data");
        if (cachedUser) {
          // User is logged in, redirect to home
          router.replace("/(tabs)/Home");
          return;
        }

        // Then check onboarding status
        const onboardingSeen = await AsyncStorage.getItem("onboarding_seen");
        if (onboardingSeen === "true") {
          router.replace("/(auth)/sign-in");
          return;
        }
      } catch {}
      if (mounted) setIsBooting(false);
    };
    checkOnboardingSeen();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Modern glassmorphism shadow helper
  const cardShadow = Platform.select({
    ios: {
      shadowColor: isDark ? "#000" : "#6366F1",
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 20,
    },
    android: { elevation: isDark ? 12 : 8 },
    default: {},
  });

  // Animated gradient colors
  const gradientColors = isDark
    ? ["#1F2937", "#111827", "#0F172A"]
    : ["#FEF3C7", "#FDE68A", "#FCD34D"];

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Until we confirm onboarding should be shown, render nothing to avoid flashes
  if (isBooting) return null;

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? colors.background[0] : "#F8F5F2",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              const slide = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              if (slide !== currentSlide) {
                setCurrentSlide(slide);
              }
            }}
          >
            {onboarding.map((slide, index) => (
              <View
                key={index}
                style={{ width }}
                className="justify-between px-6 py-12"
              >
                {/* Status bar area */}
                <View className="h-8" />

                {/* Main content area */}
                <View className="flex-1 justify-center items-center">
                  {slide.image ? (
                    <View className="items-center mb-8">
                      <Image
                        source={slide.image}
                        className="w-80 h-80"
                        resizeMode="contain"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </View>
                  ) : (
                    /* Welcome screen with abstract graphic */
                    <View className="items-center justify-center h-80 mb-8">
                      <View
                        className="w-64 h-64 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.1)"
                            : "rgba(99, 102, 241, 0.05)",
                          borderWidth: 2,
                          borderColor: isDark ? "#6366F1" : "#6366F130",
                        }}
                      >
                        <Text className="text-6xl">📚</Text>
                      </View>
                    </View>
                  )}

                  {/* Title */}
                  <Text
                    className={`text-center font-quicksandBold mb-4 ${
                      slide.image ? "text-4xl" : "text-5xl"
                    }`}
                    style={{
                      color: isDark ? colors.text : "#1F2937",
                      lineHeight: slide.image ? 48 : 56,
                    }}
                  >
                    {slide.title}
                  </Text>

                  {/* Description - only show if not welcome screen */}
                  {slide.image && (
                    <Text
                      className="text-center text-base font-quicksandMedium px-4"
                      style={{
                        color: isDark ? colors.textSecondary : "#6B7280",
                        lineHeight: 24,
                      }}
                    >
                      {slide.description}
                    </Text>
                  )}
                </View>

                {/* Bottom navigation area */}
                <View className="flex-row justify-between items-center px-4">
                  {/* Skip button */}
                  <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                    <Text
                      className="font-quicksandMedium text-base"
                      style={{
                        color: isDark ? colors.textSecondary : "#6B7280",
                      }}
                    >
                      Skip
                    </Text>
                  </TouchableOpacity>

                  {/* Next button */}
                  <TouchableOpacity
                    onPress={handleNext}
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: "#6366F1",
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-forward" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Modern page indicators */}
          <View className="absolute left-0 right-0 top-16 flex-row justify-center space-x-2">
            {onboarding.map((_, index) => (
              <Animated.View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8" : "w-2"
                }`}
                style={{
                  backgroundColor:
                    index === currentSlide
                      ? isDark
                        ? colors.primary
                        : "#6366F1"
                      : isDark
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(0, 0, 0, 0.1)",
                }}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
