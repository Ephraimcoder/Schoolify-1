import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
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
      <LinearGradient
        colors={gradientColors}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
                className="justify-start px-6 pt-8 pb-32"
              >
                {/* Modern brand header with glassmorphism */}
                <View className="items-center mb-4">
                  <View className="backdrop-blur-xl bg-white/10 rounded-2xl px-6 py-3 border border-white/20">
                    <Text className="text-2xl font-quicksandBold text-white">
                      Schoolify<Text className="text-yellow-300">.</Text>
                    </Text>
                  </View>
                </View>

                {/* Hero image with modern glassmorphism card */}
                <View className="items-center mb-4">
                  <View className="relative">
                    {/* Glow effect */}
                    <View className="absolute inset-0 bg-yellow-400/20 rounded-3xl blur-xl" />

                    {/* Main card */}
                    <View
                      className="w-96 h-96 rounded-3xl items-center justify-center overflow-hidden backdrop-blur-xl border border-white/20"
                      style={[
                        cardShadow,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(255, 255, 255, 0.25)",
                        },
                      ]}
                    >
                      <Image
                        source={slide.image}
                        className="w-full h-full"
                        resizeMode="contain"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </View>
                  </View>
                </View>

                {/* Title & description with modern typography - moved to lower third */}
                <View className="px-4 items-center absolute bottom-40 left-0 right-0">
                  <Text className="text-3xl text-center font-quicksandBold leading-tight text-white mb-3">
                    {slide.title}
                  </Text>
                  <Text className="text-lg text-center font-quicksandMedium leading-relaxed text-white/80">
                    {slide.description}
                  </Text>
                </View>

                {/* Modern action buttons with glassmorphism */}
                <View className="absolute left-0 right-0 bottom-8 items-center justify-center">
                  <TouchableOpacity
                    onPress={handleNext}
                    className="py-4 rounded-full items-center w-56 backdrop-blur-xl border border-white/30"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white font-quicksandBold text-base mr-2">
                        {slide.buttonText ||
                          (currentSlide === onboarding.length - 1
                            ? "Get Started"
                            : "Next")}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSkip}
                    className="mt-4 items-center py-3 px-6 backdrop-blur-xl rounded-full border border-white/20"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-white/70 font-quicksandMedium text-sm">
                      Skip
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Modern page indicators */}
          <View className="absolute left-0 right-0 top-20 flex-row justify-center space-x-2">
            {onboarding.map((_, index) => (
              <Animated.View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8" : "w-2"
                }`}
                style={{
                  backgroundColor:
                    index === currentSlide
                      ? "rgba(255, 255, 255, 0.9)"
                      : "rgba(255, 255, 255, 0.3)",
                }}
              />
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}
