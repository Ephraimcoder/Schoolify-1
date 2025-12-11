import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const ClassCard = ({ item }) => {
  return (
    <View
      className="flex-row items-center p-4 rounded-lg mb-3"
      style={{ backgroundColor: item.color }}
    >
      <View className="p-2 bg-white rounded-lg">
        <Ionicons name={item.icon} size={24} color="black" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-quicksandSemiBold">{item.title}</Text>
        <Text className="text-sm text-gray-500 font-quicksand">{item.time}</Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color="black" />
    </View>
  );
};

export default ClassCard;
