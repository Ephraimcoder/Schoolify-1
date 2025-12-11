import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ItemManagementModal = ({
  visible,
  onClose,
  onAddItem,
  type, // 'category' or 'priority'
  items,
  onDeleteItem,
}) => {
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
        <View className="w-full max-w-md bg-white rounded-xl p-6">
          <Text className="text-xl font-quicksandBold mb-4">
            {displayTitle}
          </Text>

          {/* Add New Item */}
          <View className="flex-row items-center mb-4">
            <TextInput
              className="flex-1 border border-gray-300 p-3 rounded-l-lg"
              placeholder={`Add new ${displayType}...`}
              value={itemName}
              onChangeText={setItemName}
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              className="bg-indigo-600 p-3 rounded-r-lg"
              onPress={handleAdd}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* List of Existing Items */}
          <View className=" min-h-[100px] max-h-64">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2 border-b border-gray-100"
                >
                  <Text className="text-gray-800 font-quicksandMedium">
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
            className="mt-6 bg-gray-100 py-3 rounded-lg items-center"
          >
            <Text className="text-gray-800 font-quicksandSemiBold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ItemManagementModal;
