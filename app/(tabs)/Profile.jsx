import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnalyticsModal } from "../../components/AnalyticsModal";
import { TasksContext } from "../../context/TasksContext";
import { useUser } from "../../context/UserContext";

const dummy = {
  name: "Masud Rana",
  email: "masud.rana@example.com",
  avatar:
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=300&auto=format&fit=crop",
  points: 12,
  cashback: "AED 10.0",
  options: [
    { id: "personal", label: "Personal Details", icon: "person-outline" },
  ],
};

const SectionItem = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="flex-row items-center justify-between bg-white rounded-2xl py-4 px-4 mb-3 border border-gray-100"
  >
    <View className="flex-row items-center">
      <View className="w-10 h-10 rounded-full bg-gray-50 justify-center items-center mr-3">
        <Ionicons name={icon} size={20} color="#374151" />
      </View>
      <Text className="text-gray-800 font-quicksandSemiBold text-base">
        {label}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

const StatCard = ({ icon, value, label, color = "#6B7280", onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 bg-white rounded-2xl p-4 mr-3 last:mr-0 border border-gray-100"
  >
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="ml-2 font-quicksandBold text-gray-800 text-base">
        {value}
      </Text>
    </View>
    <Text className="text-gray-500 font-quicksand text-xs">{label}</Text>
  </TouchableOpacity>
);

const Profile = () => {
  const router = useRouter();
  const { user, logout } = useUser();
  const { tasks } = useContext(TasksContext);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const stats = useMemo(
    () => [
      {
        id: "tasks",
        label: "Total Tasks",
        value: tasks.length.toString(),
        icon: "checkmark-done-outline",
        color: "#3B82F6",
      },
      {
        id: "completed",
        label: "Completed",
        value: tasks.filter((t) => t.isCompleted).length.toString(),
        icon: "checkmark-circle-outline",
        color: "#10B981",
      },
      {
        id: "completion",
        label: "Completion",
        value: `${
          tasks.length > 0
            ? Math.round(
                (tasks.filter((t) => t.isCompleted).length / tasks.length) * 100
              )
            : 0
        }%`,
        icon: "stats-chart-outline",
        color: "#8B5CF6",
      },
      {
        id: "analytics",
        label: "View Analytics",
        value: "",
        icon: "analytics-outline",
        color: "#F59E0B",
        onPress: () => setShowAnalytics(true),
      },
    ],
    [tasks]
  );

  const profile = {
    name: user?.name || dummy.name,
    email: user?.email || dummy.email,
    avatar:
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || dummy.name
      )}&background=4F46E5&color=fff`,
    points: dummy.points,
    cashback: dummy.cashback,
    stats,
    options: dummy.options,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FEFBF6]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-quicksandBold text-gray-900">
          My Profile
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={logout}
            className="w-12 h-12 rounded-full items-center justify-center mr-2"
          >
            <MaterialIcons name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="p-2"
          >
            <Ionicons name="settings-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Card header with avatar */}
          <View className="mx-5 mt-2 bg-white rounded-3xl items-center p-6 border border-gray-100">
            <Image
              source={{ uri: profile.avatar }}
              className="w-24 h-24 rounded-full"
            />
            <Text className="mt-3 text-xl font-quicksandBold text-gray-900">
              {profile.name}
            </Text>
            <Text className="text-gray-500 font-quicksand text-sm">
              {profile.email}
            </Text>
          </View>

          {/* Stats grid */}
          <View className="px-5 mt-6">
            <View className="flex-row flex-wrap justify-between">
              {profile.stats.map((stat) => (
                <TouchableOpacity
                  key={stat.id}
                  onPress={stat.onPress}
                  className="w-[48%] bg-white rounded-2xl p-4 mb-4 border border-gray-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Ionicons name={stat.icon} size={20} color={stat.color} />
                    </View>
                  </View>
                  <Text className="text-2xl font-quicksandBold text-gray-900 mt-2">
                    {stat.value}
                  </Text>
                  <Text className="text-gray-500 font-quicksand text-sm">
                    {stat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options list */}
          <View className="px-5 mt-5 mb-6">
            {profile.options.map((opt) => (
              <SectionItem
                key={opt.id}
                icon={opt.icon}
                label={opt.label}
                onPress={() => {
                  if (opt.id === "personal") {
                    router.push("/personal-details");
                  }
                }}
              />
            ))}
          </View>
        </ScrollView>

        {/* Delete Account Button - Fixed at bottom */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
          <TouchableOpacity
            onPress={() => {
              // Add delete account functionality here
              alert("Delete account functionality will be implemented here");
            }}
            className="flex-row items-center justify-center bg-white rounded-2xl py-4 border border-red-100"
          >
            <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            <Text className="ml-2 text-red-500 font-quicksandBold">
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <AnalyticsModal
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        tasks={tasks}
      />
    </SafeAreaView>
  );
};

export default Profile;
