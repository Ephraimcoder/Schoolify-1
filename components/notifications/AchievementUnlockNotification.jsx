import { useEffect, useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

const AchievementUnlockNotification = ({
  achievement,
  visible,
  onClose,
  index = 0,
}) => {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const getRarityColors = (rarity) => {
    const colors = {
      common: {
        border: isDark ? "border-gray-600" : "border-gray-300",
        bg: isDark ? "bg-gray-800" : "bg-white",
        accent: isDark ? "bg-gray-700" : "bg-gray-100",
        text: isDark ? "text-gray-300" : "text-gray-700",
        glow: isDark ? "#9CA3AF" : "#6B7280",
      },
      rare: {
        border: isDark ? "border-blue-600" : "border-blue-400",
        bg: isDark ? "bg-blue-900" : "bg-blue-50",
        accent: isDark ? "bg-blue-800" : "bg-blue-100",
        text: isDark ? "text-blue-300" : "text-blue-700",
        glow: isDark ? "#3B82F6" : "#2563EB",
      },
      epic: {
        border: isDark ? "border-purple-600" : "border-purple-400",
        bg: isDark ? "bg-purple-900" : "bg-purple-50",
        accent: isDark ? "bg-purple-800" : "bg-purple-100",
        text: isDark ? "text-purple-300" : "text-purple-700",
        glow: isDark ? "#8B5CF6" : "#7C3AED",
      },
      legendary: {
        border: isDark ? "border-yellow-600" : "border-yellow-400",
        bg: isDark ? "bg-yellow-900" : "bg-yellow-50",
        accent: isDark ? "bg-yellow-800" : "bg-yellow-100",
        text: isDark ? "text-yellow-300" : "text-yellow-700",
        glow: isDark ? "#EAB308" : "#CA8A04",
      },
    };
    return colors[rarity] || colors.common;
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, // Ensure full opacity
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1, // Ensure full scale
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400, // Longer fade out
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -150, // More dramatic slide
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.7, // Slight scale down
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  useEffect(() => {
    if (visible && achievement) {
      animateIn();
    }
  }, [visible, achievement]);

  const handleClose = () => {
    animateOut(onClose);
  };

  if (!visible || !achievement) return null;

  const rarityColors = getRarityColors(achievement.rarity);
  const topOffset = 60 + index * 120; // Stack notifications vertically

  return (
    <Animated.View
      className="absolute left-4 right-4 z-50"
      style={{
        top: topOffset,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <View
        className={`rounded-2xl p-4 shadow-2xl border ${rarityColors.bg} ${rarityColors.border}`}
        style={{
          shadowColor: rarityColors.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        {/* Header with icon */}
        <View className="flex-row items-center mb-2">
          <Text className="text-3xl mr-3">{achievement.icon}</Text>
          <View className="flex-1">
            <Text
              className={`text-base font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
              numberOfLines={1}
            >
              🎉 Achievement Unlocked!
            </Text>
            <Text
              className={`text-sm font-bold ${rarityColors.text}`}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
          </View>
        </View>

        {/* Achievement details */}
        <View className={`p-2 rounded-lg ${rarityColors.accent} mb-2`}>
          <Text className={`text-xs ${rarityColors.text}`} numberOfLines={2}>
            {achievement.description}
          </Text>
        </View>

        {/* Rarity badge */}
        <View className="flex-row justify-between items-center">
          <View className={`px-3 py-1 rounded-full ${rarityColors.accent}`}>
            <Text
              className={`text-xs font-bold capitalize ${rarityColors.text}`}
            >
              {achievement.rarity}
            </Text>
          </View>
          <Text className={`text-xs ${rarityColors.text}`}>
            {achievement.progress}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default AchievementUnlockNotification;
