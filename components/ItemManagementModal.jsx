import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
const ItemManagementModal = ({
  visible,
  onClose,
  onAddItem,
  type, // 'category' or 'priority'
  items,
  onDeleteItem,
}) => {
  const { isDark } = useTheme();
  const [itemName, setItemName] = useState("");
  const displayTitle = type === "category" ? "Courses" : "Priorities";
  const displayType = type === "category" ? "course" : type;

  useEffect(() => {
    if (!visible) {
      setItemName("");
    }
  }, [visible]);

  const handleAdd = () => {
    if (itemName.trim()) {
      onAddItem(itemName);
      setItemName("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View
          className={`w-full max-w-md rounded-xl p-6 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Text
            className={`text-xl font-quicksandBold mb-4 ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {displayTitle}
          </Text>

          {/* Add New Item */}
          <View className="flex-row items-center mb-4">
            <TextInput
              className={`flex-1 p-3 rounded-l-lg ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder={`Add new ${displayType}...`}
              value={itemName}
              onChangeText={setItemName}
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              className="bg-indigo-600 p-3 rounded-r-lg"
              onPress={handleAdd}
            >
              <Ionicons
                name="add"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          {/* List of Existing Items */}
          <View className=" min-h-[100px] max-h-64">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <View
                  key={item.id}
                  className={`flex-row items-center justify-between py-2 border-b ${
                    isDark ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  <Text
                    className={`font-quicksandMedium ${
                      isDark ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDeleteItem && onDeleteItem(item.id)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className={`mt-6 py-3 rounded-lg items-center ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-quicksandSemiBold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ItemManagementModal;
