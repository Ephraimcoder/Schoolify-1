import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnalyticsModal } from "../../components/AnalyticsModal";
import ScreenAnimation from "../../components/ScreenAnimation";
import { useAppwriteSync, useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { isBackupEnabled } from "../../helpers/syncHelper";
import { showError } from "../../utils/toast";

const SectionItem = ({ icon, label, onPress, isDark, iconColor }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className={`flex-row items-center justify-between rounded-2xl py-4 px-4 mb-3 border ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
    }`}
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
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 rounded-2xl p-4 mr-3 last:mr-0 border ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
    }`}
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
  const { user, logout, deleteAccount } = useUser();
  const { tasks } = useTasks();
  const [isOnline, setIsOnline] = useState(true);
  const { isDark } = useTheme();
  const [backupEnabled, setBackupEnabled] = useState(true);
  const {
    isSyncing,
    syncError,
    syncUnsyncedTasks,
    mergeAppwriteTasks,
    syncDeletedTasks,
    syncAllTasksIntelligently,
  } = useAppwriteSync();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [progress, setProgress] = useState({ step: "", message: "" });

  // Check backup preference when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkBackupPreference = async () => {
        try {
          const enabled = await isBackupEnabled();
          setBackupEnabled(enabled);
        } catch (error) {
          showError("Error finding backup preference");
          setBackupEnabled(true); // Default to enabled
        }
      };

      checkBackupPreference();
    }, []),
  );

  // Monitor network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);
    };

    checkNetworkStatus();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Intelligent sync handler
  const handleSyncAllTasks = async () => {
    if (!isOnline) {
      Alert.alert(
        "Offline",
        "Sync requires an internet connection. Please check your network and try again.",
      );
      return;
    }

    // Check if backup is enabled
    if (!backupEnabled) {
      Alert.alert(
        "Backup Disabled",
        "Sync is disabled because backup is turned off. Please enable backup in settings to use sync features.",
      );
      return;
    }

    try {
      setSyncStatus("🚀 Starting intelligent sync...");
      const results = await syncAllTasksIntelligently(({ step, message }) => {
        setProgress({ step, message });
      });

      if (results.success) {
        const summary = results.summary;
        setSyncStatus(
          `✅ Sync Complete! ${summary.totalCreated} created, ${summary.totalUpdated} updated, ${summary.totalDeleted} deleted, ${summary.totalMerged} merged`,
        );
      } else {
        setSyncStatus(`❌ Sync failed`);
      }
    } catch (error) {
      setSyncStatus(`❌ Error: ${error.message}`);
    } finally {
      // Clear progress after a delay
      setTimeout(() => setProgress({ step: "", message: "" }), 2000);
    }
  };

  // Handle deletion sync
  const handleSyncDeletedTasks = async () => {
    if (!isOnline) {
      Alert.alert(
        "Offline",
        "Sync requires an internet connection. Please check your network and try again.",
      );
      return;
    }

    // Check if backup is enabled
    if (!backupEnabled) {
      Alert.alert(
        "Backup Disabled",
        "Sync is disabled because backup is turned off. Please enable backup in settings to use sync features.",
      );
      return;
    }

    try {
      setSyncStatus("🗑️ Syncing deleted tasks...");
      const results = await syncDeletedTasks();

      if (results.success) {
        setSyncStatus(`✅ Deleted ${results.deleted} tasks from cloud`);
      } else {
        setSyncStatus(`❌ Delete sync failed`);
      }
    } catch (error) {
      setSyncStatus(`❌ Error: ${error.message}`);
    }
  };

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
        className={`flex-1 ${isDark ? "bg-gray-900" : "bg-[#FEFBF6]"}`}
      >
        {/* Header */}
        <View
          className={`flex-row justify-between items-center px-5 py-4 border-b ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
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
              className={`mx-5 mt-2 rounded-3xl items-center p-6 border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
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
                    className={`w-[48%] rounded-2xl p-4 mb-4 border ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-100"
                    }`}
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
                />
              ))}

              {/* Settings Button */}
              <SectionItem
                icon="settings-outline"
                label="Settings"
                onPress={() => router.push("/settings")}
                isDark={isDark}
              />
            </View>

            {/* Appwrite Sync Test Section */}
            <View className="px-5 mt-5 mb-6">
              <View
                className={`rounded-2xl p-4 border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <Text
                  className={`text-lg font-quicksandBold mb-3 ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Sync Tasks To Cloud
                </Text>

                {/* Progress Bar */}
                {progress.step && (
                  <View
                    className={`rounded-lg p-3 mb-3 ${
                      isDark ? "bg-blue-900/20" : "bg-blue-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-quicksand mb-2 ${
                        isDark ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      {progress.message}
                    </Text>
                    <View
                      className={`h-2 rounded-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <View
                        className={`h-2 rounded-full ${
                          progress.step === "syncing"
                            ? "bg-blue-500 w-1/2"
                            : progress.step === "merging"
                              ? "bg-green-500 w-full"
                              : "bg-purple-500 w-full"
                        }`}
                      />
                    </View>
                  </View>
                )}

                {/* Sync Status */}
                {syncStatus ? (
                  <View
                    className={`rounded-lg p-3 mb-3 ${
                      isDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-quicksand ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {syncStatus}
                    </Text>
                  </View>
                ) : null}

                {/* Sync Error */}
                {syncError ? (
                  <View
                    className={`rounded-lg p-3 mb-3 ${
                      isDark ? "bg-red-900/20" : "bg-red-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-quicksand ${
                        isDark ? "text-red-400" : "text-red-700"
                      }`}
                    >
                      Error: {syncError}
                    </Text>
                  </View>
                ) : null}

                {/* Loading Indicator */}
                {isSyncing && (
                  <View className="flex-row items-center justify-center py-3 mb-3">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text
                      className={`ml-2 text-sm font-quicksand ${
                        isDark ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      Syncing with Appwrite...
                    </Text>
                  </View>
                )}

                {/* Sync Buttons */}
                <View className="space-y-3 gap-2">
                  <TouchableOpacity
                    onPress={handleSyncAllTasks}
                    disabled={isSyncing || !isOnline || !backupEnabled}
                    className={`py-3 rounded-lg flex-row items-center justify-center ${
                      isSyncing || !isOnline || !backupEnabled
                        ? "bg-gray-300"
                        : "bg-purple-500"
                    }`}
                  >
                    <Ionicons name="sync" size={18} color="white" />
                    <Text className="ml-2 text-white font-quicksandSemiBold">
                      Intelligent Full Sync
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSyncDeletedTasks}
                    disabled={isSyncing || !isOnline || !backupEnabled}
                    className={`py-3 rounded-lg flex-row items-center justify-center ${
                      isSyncing || !isOnline || !backupEnabled
                        ? "bg-gray-300"
                        : "bg-red-500"
                    }`}
                  >
                    <Ionicons name="trash-outline" size={18} color="white" />
                    <Text className="ml-2 text-white font-quicksandSemiBold">
                      Sync Deleted Tasks
                    </Text>
                  </TouchableOpacity>
                </View>

                {!backupEnabled && (
                  <View
                    className={`rounded-lg p-3 mb-3 ${
                      isDark ? "bg-yellow-900/20" : "bg-yellow-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-quicksand ${
                        isDark ? "text-yellow-300" : "text-yellow-700"
                      }`}
                    >
                      ⚠️ Sync is disabled because backup is turned off
                    </Text>
                  </View>
                )}

                <Text
                  className={`text-xs mt-3 text-center ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {!isOnline ? (
                    <Text
                      className={`font-quicksandMedium ${
                        isDark ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      ⚠️ Offline: Sync requires internet connection
                    </Text>
                  ) : (
                    "Manual sync only - no automatic operations"
                  )}
                </Text>
              </View>
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
