import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function UpdateManager() {
  const { isDark, colors } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    checkForUpdates();

    // Development-only: Add test trigger
    if (__DEV__) {
      console.log(
        "UpdateManager: To test UI, call global.testUpdateUI() in console",
      );
      global.testUpdateUI = () => {
        setUpdateAvailable(true);
        setShowUpdatePrompt(true);
      };
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateAvailable(true);
        setShowUpdatePrompt(true);
      }
    } catch (error) {
      // Ignore errors in development (Updates not supported in dev builds)
      if (__DEV__) {
        console.log("Updates not supported in development builds");
      } else {
        console.log("Error checking for updates:", error);
      }
    }
  };

  const downloadUpdate = async () => {
    try {
      setIsUpdating(true);

      const update = await Updates.fetchUpdateAsync();

      // Simulate progress (expo-updates doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await update;

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setShowUpdatePrompt(false);

      // Prompt user to restart
      Alert.alert(
        "Update Ready",
        "The update has been downloaded. Please restart the app to apply changes.",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Restart Now",
            onPress: () => Updates.reloadAsync(),
          },
        ],
      );
    } catch (error) {
      console.log("Error downloading update:", error);
      Alert.alert("Error", "Failed to download update. Please try again.");
    } finally {
      setIsUpdating(false);
      setDownloadProgress(0);
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <Modal
      visible={showUpdatePrompt}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUpdatePrompt(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          style={{ backgroundColor: colors.card }}
          className="w-4/5 rounded-2xl p-6"
        >
          <View className="items-center mb-4">
            <Ionicons name="cloud-download-outline" size={60} color="#6366F1" />
          </View>

          <Text
            className={`text-xl font-quicksandBold text-center mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Update Available
          </Text>

          <Text
            className={`text-sm text-center mb-6 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            A new version is available with improvements and bug fixes.
          </Text>

          {isUpdating ? (
            <View className="mb-4">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text
                className={`text-center mt-2 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Downloading... {downloadProgress}%
              </Text>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowUpdatePrompt(false)}
                className="flex-1 py-3 rounded-xl border-2"
                style={{ borderColor: colors.border }}
              >
                <Text
                  className={`text-center font-quicksandMedium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Later
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={downloadUpdate}
                className="flex-1 py-3 rounded-xl bg-indigo-500"
              >
                <Text className="text-center font-quicksandMedium text-white">
                  Update Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
