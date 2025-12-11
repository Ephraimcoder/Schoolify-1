import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, TextInput, TouchableOpacity, View } from "react-native";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search tasks, classes...",
  onSubmit,
  onSearch, // backward compatibility
  onClear,
  autoFocus = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const isControlled = value !== undefined;
  const text = isControlled ? value : internalValue;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChange = (t) => {
    if (!isControlled) setInternalValue(t);
    onChangeText?.(t);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    onChangeText?.("");
    onClear?.();
  };

  const handleSubmit = () => {
    const submitHandler = onSubmit || onSearch;
    if (submitHandler) submitHandler(text);
  };

  return (
    <View className="relative">
      <Animated.View
        className={`flex-row items-center bg-white rounded-2xl p-4 shadow-sm ${
          isFocused ? "border-2 border-indigo-100" : "border border-gray-100"
        }`}
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? "#4F46E5" : "#9CA3AF"}
          className="mr-3"
        />
        <TextInput
          value={text}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="flex-1 font-quicksand text-base text-gray-800"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        {text?.length ? (
          <TouchableOpacity
            onPress={handleClear}
            className="p-1.5 rounded-lg ml-2"
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handlePress}
            className="p-1.5 bg-gray-50 rounded-lg ml-2"
          >
            <Ionicons name="options-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}
