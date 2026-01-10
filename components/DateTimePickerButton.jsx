import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
const DateTimePickerButton = ({
  value,
  onValueChange,
  mode = "date", // 'date' or 'time'
  label,
  placeholder = "Select",
  containerStyle = "",
  buttonStyle = "",
  textStyle = "",
  minimumDate,
  is24Hour = false,
}) => {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || new Date());

  // Update selectedValue when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedValue(new Date(value));
    }
  }, [value]);

  const formatDisplayValue = (date) => {
    if (!date) return placeholder;

    const dateObj = date instanceof Date ? date : new Date(date);

    if (mode === "date") {
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } else {
      return dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !is24Hour,
      });
    }
  };

  const handleChange = (event, selectedValue) => {
    const isIos = Platform.OS === "ios";
    setShowPicker(isIos);

    if (selectedValue) {
      setSelectedValue(selectedValue);
      onValueChange(selectedValue);
    }
  };

  return (
    <View
      className={`flex-1 ${mode === "time" ? "ml-2" : "mr-2"} ${containerStyle}`}
    >
      <Text
        className={`text-sm font-quicksandBold mb-1 ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
      <TouchableOpacity
        className={`border rounded-lg p-3 flex-row justify-between items-center ${buttonStyle} ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
        onPress={() => setShowPicker(true)}
      >
        <Text
          className={`font-quicksandMedium ${textStyle} ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {formatDisplayValue(selectedValue)}
        </Text>
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={18}
          color="#6B7280"
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedValue}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          minimumDate={minimumDate}
          is24Hour={is24Hour}
        />
      )}
    </View>
  );
};

export default DateTimePickerButton;
