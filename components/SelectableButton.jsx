import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";

const SelectableButton = ({
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

  // Dynamic colors based on theme
  const dynamicUnselectedBgColor = isDark ? "bg-gray-800" : unselectedBgColor;
  const dynamicUnselectedTextColor = isDark
    ? "text-gray-300"
    : unselectedTextColor;
  const dynamicBorderColor = isDark ? "border-gray-700" : borderColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        isSelected
          ? `${selectedBgColor} border-transparent`
          : `${dynamicUnselectedBgColor} ${dynamicBorderColor}`
      } ${className}`}
    >
      <Text
        className={`font-quicksand ${
          isSelected ? selectedTextColor : dynamicUnselectedTextColor
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default SelectableButton;
