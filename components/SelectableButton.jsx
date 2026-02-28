import { memo, useState } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";

const SelectableButton = memo(
  ({
    label,
    isSelected,
    onPress,
    selectedBgColor = "bg-blue-500",
    selectedTextColor = "text-white",
    unselectedBgColor = "bg-white",
    unselectedTextColor = "text-gray-700",
    borderColor = "border-gray-200",
    className = "",
  }) => {
    const { isDark } = useTheme();
    const [scaleAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    // Dynamic colors based on theme
    const dynamicUnselectedBgColor = isDark ? "bg-gray-800" : unselectedBgColor;
    const dynamicUnselectedTextColor = isDark
      ? "text-gray-300"
      : unselectedTextColor;
    const dynamicBorderColor = isDark ? "border-gray-700" : borderColor;

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className={`px-4 py-2 rounded-full border ${
          isSelected
            ? `${selectedBgColor} border-transparent`
            : `${dynamicUnselectedBgColor} ${dynamicBorderColor}`
        } ${className}`}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text
            className={`font-quicksand ${
              isSelected ? selectedTextColor : dynamicUnselectedTextColor
            }`}
          >
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

SelectableButton.displayName = "SelectableButton";

export default SelectableButton;
