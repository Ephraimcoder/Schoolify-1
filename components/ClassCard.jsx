import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ClassCard = ({ item, onPress }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-quicksandBold text-gray-900 mr-2">
              {item.title}
            </Text>
            {item.priority && (
              <Text
                className={`text-xs font-quicksandBold px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}
              >
                {item.priority}
              </Text>
            )}
          </View>

          {item.description && (
            <Text
              className="text-gray-600 font-quicksand text-sm mb-2"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-gray-600 text-xs font-quicksandMedium ml-1">
              {format(new Date(item.dueDate), "MMM d, yyyy")} •{" "}
              {formatTime(item.dueTime)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

export default ClassCard;
