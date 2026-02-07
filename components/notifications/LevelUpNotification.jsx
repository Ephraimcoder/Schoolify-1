import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

const LevelUpNotification = ({ levelData, visible, onClose, index = 0 }) => {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const getLevelTitle = (level) => {
    const titles = {
      1: "Novice",
      2: "Apprentice",
      3: "Journeyman",
      4: "Expert",
      5: "Master",
      6: "Grandmaster",
      7: "Legend",
      8: "Mythic",
      9: "Transcendent",
      10: "Divine",
    };
    return titles[level] || "Transcendent";
  };

  const isMilestoneLevel = (level) => {
    return level % 5 === 0 || level === 10; // Every 5 levels and level 10
  };

  const animateIn = () => {
    // Glow effect for milestone levels
    if (isMilestoneLevel(levelData.level)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, // Ensure full opacity
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, // Ensure full scale
        tension: 50,
        friction: 7,
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
    if (visible && levelData) {
      animateIn();
    }
  }, [visible, levelData]);

  const handleClose = () => {
    animateOut(onClose);
  };

  if (!visible || !levelData) return null;

  const topOffset = 60 + index * 140; // More space for level up notifications
  const isMilestone = isMilestoneLevel(levelData.level);

  return (
    <Animated.View
      className="absolute left-4 right-4 z-50"
      style={{
        top: topOffset,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      {/* Glow effect for milestone levels */}
      {isMilestone && (
        <Animated.View
          className="absolute inset-0 rounded-2xl"
          style={{
            backgroundColor: isDark ? "#FBBF24" : "#F59E0B",
            opacity: glowAnim * 0.4, // Increased opacity for better visibility
            shadowColor: "#F59E0B",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowAnim * 0.6, // Increased shadow opacity
            shadowRadius: 20,
            elevation: 12,
          }}
        />
      )}

      <View
        className={`rounded-2xl p-4 shadow-2xl border ${
          isMilestone
            ? isDark
              ? "bg-gradient-to-r from-yellow-900 to-orange-900 border-yellow-600"
              : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400"
            : isDark
              ? "bg-purple-700 border-purple-500"
              : "bg-purple-200 border-purple-400"
        }`}
        style={{
          shadowColor: isMilestone ? "#F59E0B" : "#8B5CF6",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 15,
          elevation: 10,
        }}
      >
        {/* Header with level icon */}
        <View className="flex-row items-center mb-3">
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
              isMilestone
                ? isDark
                  ? "bg-yellow-800"
                  : "bg-yellow-200"
                : isDark
                  ? "bg-purple-600"
                  : "bg-purple-300"
            }`}
          >
            <Ionicons
              name={isMilestone ? "trophy" : "star"}
              size={24}
              color={isMilestone ? "#F59E0B" : "#8B5CF6"}
            />
          </View>
          <View className="flex-1">
            <Text
              className={`text-lg font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              ⚡ Level Up!
            </Text>
            <Text
              className={`text-sm font-bold ${
                isMilestone
                  ? isDark
                    ? "text-yellow-400"
                    : "text-yellow-600"
                  : isDark
                    ? "text-purple-400"
                    : "text-purple-600"
              }`}
            >
              Level {levelData.level} • {getLevelTitle(levelData.level)}
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View
          className={`p-3 rounded-lg ${
            isMilestone
              ? isDark
                ? "bg-yellow-800"
                : "bg-yellow-100"
              : isDark
                ? "bg-purple-600"
                : "bg-purple-200"
          } mb-3`}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className={`text-xs font-medium ${
                isMilestone
                  ? isDark
                    ? "text-yellow-400"
                    : "text-yellow-600"
                  : isDark
                    ? "text-purple-400"
                    : "text-purple-600"
              }`}
            >
              Total XP
            </Text>
            <Text
              className={`text-sm font-bold ${
                isMilestone
                  ? isDark
                    ? "text-yellow-400"
                    : "text-yellow-600"
                  : isDark
                    ? "text-purple-400"
                    : "text-purple-600"
              }`}
            >
              {levelData.xp} XP
            </Text>
          </View>

          {/* Progress bar to next level */}
          <View
            className={`h-2 rounded-full overflow-hidden ${
              isDark ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <View
              className={`h-full rounded-full ${
                isMilestone
                  ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                  : "bg-gradient-to-r from-purple-400 to-purple-600"
              }`}
              style={{
                width: `${(levelData.currentLevelXP / 100) * 100}%`,
              }}
            />
          </View>

          <Text
            className={`text-xs mt-1 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {levelData.currentLevelXP}/100 XP to next level
          </Text>
        </View>

        {/* Milestone celebration message */}
        {isMilestone && (
          <View
            className={`p-2 rounded-lg text-center ${
              isDark ? "bg-yellow-800" : "bg-yellow-100"
            }`}
          >
            <Text
              className={`text-xs font-bold text-center ${
                isDark ? "text-yellow-400" : "text-yellow-600"
              }`}
            >
              🎉 Milestone Achievement! You've reached Level {levelData.level}!
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default LevelUpNotification;
