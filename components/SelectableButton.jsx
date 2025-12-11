import React from "react";
import { Text, TouchableOpacity } from "react-native";

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
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        isSelected
          ? `${selectedBgColor} border-transparent`
          : `${unselectedBgColor} ${borderColor}`
      } ${className}`}
    >
      <Text
        className={`font-quicksand ${
          isSelected ? selectedTextColor : unselectedTextColor
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default SelectableButton;
