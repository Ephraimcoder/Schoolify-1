import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { getNotificationLeadMinutes } from "../utils/notificationPrefs";

const PersonalDetails = () => {
  const router = useRouter();
  const { user } = useUser();
  const [leadMinutes, setLeadMinutes] = useState(15);
  const minuteOptions = [5, 10, 15, 30, 60, 120];

  useEffect(() => {
    (async () => {
      const saved = await getNotificationLeadMinutes();
      setLeadMinutes(saved);
    })();
  }, []);

  // Only show fields that we have data for
  const userInfo = [
    { label: "Full Name", value: user?.name, icon: "person-outline" },
    { label: "Email", value: user?.email, icon: "mail-outline" },
    // Add more fields here as they become available in the user context
  ].filter((item) => item.value); // Only include fields with values

  const InfoRow = ({ label, value, icon }) => (
    <View className="flex-row items-center justify-between py-5 border-b border-gray-100">
      <View className="flex-row items-center">
        <Ionicons
          name={icon}
          size={24}
          color="#6B7280"
          style={{ marginRight: 16 }}
        />
        <Text className="text-gray-500 font-quicksandSemiBold text-base">
          {label}
        </Text>
      </View>
      <Text
        className="text-gray-800 font-quicksand text-lg text-right"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#FEFBF6] items-center justify-center">
        <Text className="text-gray-500 font-quicksand">
          No user data available
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FEFBF6]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-5 border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-quicksandBold text-gray-800">
          Personal Details
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1 px-6 pt-7">
        <View className="bg-white rounded-2xl p-7 mb-7">
          <View className="mb-7">
            <Text className="text-2xl font-quicksandBold text-gray-900">
              Account Information
            </Text>
          </View>

          {userInfo.map((info, index) => (
            <InfoRow
              key={index}
              label={info.label}
              value={info.value}
              icon={info.icon}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalDetails;
