import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFadeAnimation } from "../hooks/useBackTransition";
const PersonalDetails = () => {
  const router = useRouter();
  const { user, deleteAccount } = useUser();
  const { isDark } = useTheme();
  const fadeAnim = useFadeAnimation();

  // Only show fields that we have data for
  const userInfo = [
    { label: "Full Name", value: user?.name, icon: "person-outline" },
    { label: "Email", value: user?.email, icon: "mail-outline" },
    // Add more fields here as they become available in the user context
  ].filter((item) => item.value); // Only include fields with values

  const InfoRow = ({ label, value, icon }) => (
    <View
      className={`flex-row items-center justify-between py-5 border-b ${
        isDark ? "border-gray-700" : "border-gray-100"
      }`}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={icon}
          size={24}
          color={isDark ? "#9CA3AF" : "#6B7280"}
          style={{ marginRight: 16 }}
        />
        <Text
          className={`font-quicksandSemiBold text-base ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {label}
        </Text>
      </View>
      <Text
        className={`font-quicksand text-lg text-right ${
          isDark ? "text-gray-100" : "text-gray-800"
        }`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-[#FEFBF6]"
        }`}
      >
        <Text
          className={`font-quicksand ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          No user data available
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          flex: 1,
        }}
      >
        <View
          className={`flex-row items-center justify-between px-5 py-5 border-b ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"
          }`}
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
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Personal Details
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView className="flex-1 px-6 pt-7">
          <View
            className={`rounded-2xl p-7 mb-7 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="mb-7">
              <Text
                className={`text-2xl font-quicksandBold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
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

          {/* Danger Zone Section */}
          <View className="px-5 mt-8 mb-6">
            <View className="mb-4">
              <Text
                className={`text-center font-quicksandBold text-lg ${
                  isDark ? "text-red-400" : "text-red-600"
                }`}
              >
                ⚠️ Danger Zone
              </Text>
              <Text
                className={`text-center font-quicksand text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Irreversible actions
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "This action cannot be undone. Are you sure you want to delete your account?",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deleteAccount();
                          Alert.alert(
                            "Account Deleted",
                            "Your account has been successfully deleted."
                          );
                          router.replace("/(auth)/sign-in");
                        } catch (error) {
                          Alert.alert("Error", error.message);
                        }
                      },
                    },
                  ]
                );
              }}
              className={`flex-row items-center justify-between rounded-2xl py-4 px-4 mb-3 border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <Text
                  className={`font-quicksandSemiBold text-base ${
                    isDark ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Delete Account
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
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default PersonalDetails;
