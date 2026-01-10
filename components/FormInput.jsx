import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

const FormInput = ({
  placeholder,
  iconRight,
  containerStyle,
  value,
  onChangeText,
  ...rest
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={containerStyle}
      className={`flex-row items-center border rounded-xl p-4 my-2 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        className={`flex-1 text-base font-quicksand ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      {iconRight && (
        <Ionicons
          name={iconRight.name}
          size={iconRight.size || 24}
          color={iconRight.color || "gray"}
        />
      )}
    </View>
  );
};

export default FormInput;
