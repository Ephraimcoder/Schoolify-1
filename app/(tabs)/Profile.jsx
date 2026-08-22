import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnalyticsModal } from "../../components/AnalyticsModal";
import ScreenAnimation from "../../components/ScreenAnimation";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const SectionItem = ({ icon, label, onPress, isDark, iconColor, colors }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{ backgroundColor: colors.card, borderColor: colors.border }}
    className="flex-row items-center justify-between rounded-2xl py-4 px-4 mb-3 border"
  >
    <View className="flex-row items-center">
      <View
        className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
          isDark ? "bg-gray-700" : "bg-gray-50"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor || (isDark ? "#D1D5DB" : "#374151")}
        />
      </View>
      <Text
        className={`font-quicksandSemiBold text-base ${
          isDark ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {label}
      </Text>
    </View>
    <View className="flex-row items-center">
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#6B7280" : "#9CA3AF"}
      />
    </View>
  </TouchableOpacity>
);

const StatCard = ({
  icon,
  value,
  label,
  color = "#6B7280",
  onPress,
  isDark,
  colors,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ backgroundColor: colors.card, borderColor: colors.border }}
    className="flex-1 rounded-2xl p-4 mr-3 last:mr-0 border"
  >
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={18} color={color} />
      <Text
        className={`ml-2 font-quicksandBold text-base ${
          isDark ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {value}
      </Text>
    </View>
    <Text
      className={`text-xs font-quicksand ${
        isDark ? "text-gray-400" : "text-gray-500"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Profile = () => {
  const router = useRouter();
  const { user, logout } = useUser();
  const { tasks } = useTasks();
  const { isDark, colors } = useTheme();
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
                (tasks.filter((t) => t.isCompleted).length / tasks.length) *
                  100,
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
    [tasks],
  );

  const profile = {
    name: user?.name || "",
    email: user?.email || "",
    avatar:
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4F46E5&color=fff`,
    stats,
    options: [
      {
        id: "personal",
        label: "Personal Details",
        icon: "person-outline",
        onPress: () => router.push("/personal-details"),
      },
    ],
  };

  // Don't render if user is null (during logout)
  if (!user) {
    return null;
  }

  return (
    <ScreenAnimation duration={400}>
      <SafeAreaView
        style={{ backgroundColor: colors.background[0] }}
        className="flex-1"
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.background[1],
            borderColor: colors.border,
          }}
          className="flex-row justify-between items-center px-5 py-4 border-b"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full items-center justify-center"
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color={isDark ? "#D1D5DB" : "#111827"}
            />
          </TouchableOpacity>
          <Text
            className={`text-xl font-quicksandBold ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            My Profile
          </Text>
          <View className="w-12">
            <TouchableOpacity
              onPress={async () => {
                try {
                  await logout();
                  router.replace("/(auth)/sign-in");
                } catch (error) {
                  console.error("Logout error:", error);
                }
              }}
              className="w-12 h-12 rounded-full items-center justify-center"
            >
              <MaterialIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Card header with avatar */}
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="mx-5 mt-2 rounded-3xl items-center p-6 border"
            >
              <Image
                source={{ uri: profile.avatar }}
                className="w-24 h-24 rounded-full"
              />
              <Text
                className={`mt-3 text-xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {profile.name || "User"}
              </Text>
              <Text
                className={`font-quicksand text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {profile.email || "No email"}
              </Text>
            </View>

            {/* Stats grid */}
            <View className="px-5 mt-6">
              <View className="flex-row flex-wrap justify-between">
                {profile.stats.map((stat) => (
                  <TouchableOpacity
                    key={stat.id}
                    onPress={stat.onPress}
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                    className="w-[48%] rounded-2xl p-4 mb-4 border"
                  >
                    <View className="flex-row items-center justify-between">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Ionicons
                          name={stat.icon}
                          size={20}
                          color={stat.color}
                        />
                      </View>
                    </View>
                    <Text
                      className={`text-2xl font-quicksandBold mt-2 ${
                        isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      className={`font-quicksand text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
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
                  onPress={opt.onPress}
                  isDark={isDark}
                  colors={colors}
                />
              ))}

              {/* Settings Button */}
              <SectionItem
                icon="settings-outline"
                label="Settings"
                onPress={() => router.push("/settings")}
                isDark={isDark}
                colors={colors}
              />
            </View>
          </ScrollView>
        </View>

        <AnalyticsModal
          visible={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          tasks={tasks}
        />
      </SafeAreaView>
    </ScreenAnimation>
  );
};

export default Profile;
