import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SubtaskModal({
  visible,
  onClose,
  subtasks = [],
  onAddSubtask,
  onDeleteSubtask,
}) {
  const { isDark } = useTheme();
  const [subtaskText, setSubtaskText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      onAddSubtask(subtaskText);
      setSubtaskText("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="justify-end"
        >
          <View
            className={`rounded-t-3xl p-6 h-[500px] ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className={`text-xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Add Subtasks
              </Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Subtask Input */}
            <View
              className={`flex-row items-center border rounded-xl px-4 py-3 mb-4 ${
                isInputFocused
                  ? "border-indigo-500"
                  : isDark
                    ? "border-gray-700"
                    : "border-gray-200"
              }`}
            >
              <TextInput
                className={`flex-1 font-quicksand text-base ${
                  isDark ? "text-gray-100" : "text-gray-800"
                }`}
                placeholder="Add a subtask..."
                value={subtaskText}
                onChangeText={setSubtaskText}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddSubtask}
                className="ml-2 p-1.5 bg-indigo-100 rounded-lg"
              >
                <Ionicons name="add" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Subtasks List - Fixed height container */}
            <View className="flex-1 mb-4">
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 8 }}
                nestedScrollEnabled={true}
              >
                {subtasks.length > 0 ? (
                  subtasks.map((subtask, index) => (
                    <View
                      key={`subtask-${index}-${subtask.id || ""}`}
                      className={`flex-row items-center justify-between rounded-xl p-4 mb-2 ${
                        isDark ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`font-quicksand flex-1 ${
                          isDark ? "text-gray-100" : "text-gray-800"
                        }`}
                      >
                        {subtask.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onDeleteSubtask(index)}
                        className="p-1.5"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View className="items-center py-6">
                    <Ionicons name="list-outline" size={32} color="#9CA3AF" />
                    <Text
                      className={`font-quicksand mt-2 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No subtasks yet
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-indigo-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-quicksandBold text-base">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
