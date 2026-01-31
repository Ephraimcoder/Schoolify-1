import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const AchievementDetailModal = ({ visible, achievement, onClose, isDark }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(screenWidth);

  const getRarityColors = (rarity) => {
    const colors = {
      common: {
        border: isDark ? "border-gray-600" : "border-gray-300",
        bg: isDark ? "bg-gray-800" : "bg-gray-50",
        text: isDark ? "text-gray-300" : "text-gray-700",
        icon: "#9CA3AF",
      },
      rare: {
        border: isDark ? "border-blue-600" : "border-blue-400",
        bg: isDark ? "bg-blue-900/40" : "bg-blue-50/80",
        text: isDark ? "text-blue-300" : "text-blue-700",
        icon: "#3B82F6",
      },
      epic: {
        border: isDark ? "border-purple-600" : "border-purple-400",
        bg: isDark ? "bg-purple-900/20" : "bg-purple-50",
        text: isDark ? "text-purple-300" : "text-purple-700",
        icon: "#8B5CF6",
      },
      legendary: {
        border: isDark ? "border-yellow-600" : "border-yellow-400",
        bg: isDark ? "bg-yellow-900/40" : "bg-yellow-50/80",
        text: isDark ? "text-yellow-300" : "text-yellow-700",
        icon: "#EAB308",
      },
    };
    return colors[rarity] || colors.common;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      milestone: "trophy-outline",
      priority: "flash-outline",
      streak: "flame-outline",
    };
    return icons[category] || "star-outline";
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleClose = () => {
    animateOut(onClose);
  };

  if (visible && achievement) {
    animateIn();
  }

  if (!achievement) return null;

  const rarityColors = getRarityColors(achievement.rarity);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        className="flex-1 bg-black/50 justify-center items-center"
        style={{ opacity: fadeAnim }}
      >
        {/* Modal Content */}
        <Animated.View
          className={`w-[90%] max-w-sm rounded-2xl p-6 shadow-2xl border ${rarityColors.bg} ${rarityColors.border}`}
          style={{
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Text className="text-4xl mr-3">{achievement.icon}</Text>
                <View className="flex-1">
                  <Text
                    className={`text-xl font-quicksandBold mb-1 ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {achievement.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={getCategoryIcon(achievement.category)}
                      size={14}
                      color={rarityColors.icon}
                    />
                    <Text
                      className={`text-xs font-quicksandMedium ml-1 capitalize ${rarityColors.text}`}
                    >
                      {achievement.rarity} • {achievement.category}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isDark ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text
              className={`text-sm font-quicksand mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {achievement.description}
            </Text>
          </View>

          {/* Requirements */}
          <View
            className={`p-3 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={achievement.unlocked ? "#10B981" : "#9CA3AF"}
              />
              <Text
                className={`text-xs font-quicksandMedium ml-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Requirement
              </Text>
            </View>
            <Text
              className={`text-sm font-quicksand ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {achievement.requirement}
            </Text>
          </View>

          {/* Progress */}
          <View className="mt-3">
            <View className="flex-row justify-between items-center mb-1">
              <Text
                className={`text-xs font-quicksandMedium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Progress
              </Text>
              <Text
                className={`text-xs font-quicksandBold ${
                  achievement.unlocked ? "text-green-500" : rarityColors.text
                }`}
              >
                {achievement.progress}
              </Text>
            </View>
            <View
              className={`h-2 rounded-full overflow-hidden ${
                isDark ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <View
                className={`h-full rounded-full ${
                  achievement.unlocked
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : `bg-gradient-to-r from-${rarityColors.icon.replace("#", "")}-400 to-${rarityColors.icon.replace("#", "")}-600`
                }`}
                style={{
                  width: achievement.unlocked ? "100%" : "50%", // You can calculate actual progress here
                }}
              />
            </View>
          </View>

          {/* Status Badge */}
          <View className="mt-4 items-center">
            <View
              className={`px-4 py-2 rounded-full ${
                achievement.unlocked
                  ? "bg-green-100"
                  : isDark
                    ? "bg-gray-700"
                    : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-quicksandBold ${
                  achievement.unlocked
                    ? "text-green-700"
                    : isDark
                      ? "text-gray-300"
                      : "text-gray-600"
                }`}
              >
                {achievement.unlocked ? "✨ Unlocked" : "🔒 Locked"}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default AchievementDetailModal;
