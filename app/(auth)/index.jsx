import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { onboarding } from "../../constants/index";
import { useTheme } from "../../context/ThemeContext";
const { width } = Dimensions.get("window");

export default function Index() {
  const scrollViewRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const router = useRouter();
  const { isDark, colors } = useTheme();

  const handleNext = async () => {
    if (currentSlide < onboarding.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: width * nextSlide, animated: true });
    } else {
      // Finished onboarding, go to personalization flow
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

  // Simple cross-platform shadow helper
  const cardShadow = Platform.select({
    ios: {
      shadowColor: isDark ? "#000" : "#000",
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    },
    android: { elevation: isDark ? 8 : 6 },
    default: {},
  });

  // Until we confirm onboarding should be shown, render nothing to avoid flashes
  if (isBooting) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background[0] }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const slide = Math.round(event.nativeEvent.contentOffset.x / width);
            if (slide !== currentSlide) {
              setCurrentSlide(slide);
            }
          }}
        >
          {onboarding.map((slide, index) => (
            <View
              key={index}
              style={{ width }}
              className="justify-start px-6 pt-16 pb-32"
            >
              {/* Brand header */}
              <View className="items-center mb-8">
                <Text
                  className="text-3xl font-quicksandBold"
                  style={{ color: colors.text }}
                >
                  Schoolify<Text style={{ color: colors.primary }}>.</Text>
                </Text>
              </View>

              {/* Hero image with modern card design */}
              <View className="items-center mb-12">
                <View
                  className="w-96 h-96 rounded-3xl items-center justify-center overflow-hidden"
                  style={[cardShadow, { backgroundColor: colors.card }]}
                >
                  <Image
                    source={slide.image}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Title & description */}
              <View className="px-4 items-center mb-12">
                <Text
                  className="text-4xl text-center font-quicksandBold leading-tight"
                  style={{ color: colors.text }}
                >
                  {slide.title}
                </Text>
                <Text
                  className="text-lg text-center font-quicksandMedium mt-4 leading-relaxed"
                  style={{ color: colors.textSecondary }}
                >
                  {slide.description}
                </Text>
              </View>

              {/* Pagination dots */}
              <View className="flex-row justify-center space-x-2 mb-8">
                {onboarding.map((_, i) => (
                  <View
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === i ? "w-8" : "w-2"
                    }`}
                    style={{
                      backgroundColor:
                        currentSlide === i ? colors.primary : colors.gray,
                    }}
                  />
                ))}
              </View>

              {/* Action buttons */}
              <View className="absolute left-6 right-6 bottom-8">
                <TouchableOpacity
                  onPress={handleNext}
                  className="py-4 rounded-full items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-quicksandBold text-lg">
                    {currentSlide === onboarding.length - 1
                      ? "Get Started"
                      : "Next"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSkip}
                  className="mt-4 items-center py-2"
                >
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="font-quicksandMedium"
                  >
                    Skip
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
