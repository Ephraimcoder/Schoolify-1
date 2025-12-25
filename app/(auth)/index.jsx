import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { onboarding } from "../../constants/index";

const { width } = Dimensions.get("window");

export default function Index() {
  const scrollViewRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const router = useRouter();

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
      router.replace("/(auth)/personalization/backup-settings");
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
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  });

  // Until we confirm onboarding should be shown, render nothing to avoid flashes
  if (isBooting) return null;

  return (
    <View className="flex-1 bg-amber-50">
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
              className="justify-start px-6 pt-10 pb-44"
            >
              {/* Brand header */}
              <View className="items-center">
                <Text className="text-2xl font-quicksandBold">
                  Schoolify<Text className="text-orange-600">.</Text>
                </Text>
              </View>

              {/* Hero with floating cards (placeholders) */}
              <View className="items-center mt-4">
                <View
                  className="w-11/12 h-80 bg-white rounded-3xl items-center justify-center"
                  style={[cardShadow, { overflow: "visible" }]}
                >
                  {/* Floating left destination-like card */}
                  <View
                    className="absolute left-4 top-6 bg-white rounded-2xl w-40"
                    style={[cardShadow]}
                  >
                    <Image
                      source={slide.image}
                      className="w-full h-24 rounded-t-2xl"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className="text-xs text-gray-500">Upcoming</Text>
                      <Text className="text-base font-quicksandBold">
                        Study Sprint
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Budget: —
                      </Text>
                    </View>
                  </View>

                  {/* Floating right list-like card */}
                  <View
                    className="absolute right-4 top-20 bg-white rounded-2xl w-44 p-3"
                    style={[cardShadow]}
                  >
                    {[
                      { k: "Math", d: "Due Fri" },
                      { k: "Chemistry", d: "Due Mon" },
                      { k: "History", d: "Next Week" },
                    ].map((r, i2) => (
                      <View key={i2} className="flex-row items-center py-2">
                        <View className="w-5 h-5 rounded-full bg-orange-200 mr-2" />
                        <View className="flex-1">
                          <Text className="text-xs font-quicksandMedium">
                            {r.k}
                          </Text>
                          <Text className="text-[10px] text-gray-500">
                            {r.d}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Decorative small circle bottom-left */}
                  <View className="absolute -bottom-3 left-6 w-10 h-10 bg-orange-300 rounded-full" />
                </View>
              </View>

              {/* Title & description */}
              <View className="mt-10 px-4 items-center">
                <Text className="text-5xl text-center font-quicksandBold text-black">
                  {slide.title}
                </Text>
                <Text className="text-xl text-center text-gray-600 font-quicksandMedium mt-5">
                  {slide.description}
                </Text>
              </View>

              {/* Pagination dots */}
              <View className="flex-row justify-center space-x-2 mt-8 mb-6">
                {onboarding.map((_, i) => (
                  <View
                    key={i}
                    className={`h-2 rounded-full ${currentSlide === i ? "bg-orange-600 w-7" : "bg-gray-300 w-2"}`}
                  />
                ))}
              </View>

              {/* Button pinned to bottom */}
              <View className="absolute left-6 right-6 bottom-6">
                <TouchableOpacity
                  onPress={handleNext}
                  className="bg-orange-600 py-5 rounded-full items-center"
                >
                  <Text className="text-white font-quicksandBold text-lg">
                    {currentSlide === onboarding.length - 1
                      ? "Get Started"
                      : "Next"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSkip}
                  className="mt-3 items-center"
                >
                  <Text className="text-gray-500">Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
