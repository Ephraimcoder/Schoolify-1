import { Toasts } from "@backpackapp-io/react-native-toast";

import { DatabaseProvider } from "@nozbe/watermelondb/react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFonts } from "expo-font";

import * as NavigationBar from "expo-navigation-bar";

import * as Notifications from "expo-notifications";

import { Stack, usePathname, useRouter } from "expo-router";

import { useEffect, useRef } from "react";

import {
  ActivityIndicator,
  Platform,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { enableFreeze, enableScreens } from "react-native-screens";

import NotificationQueue from "../components/notifications/NotificationQueue";

import useGamificationNotifications from "../components/notifications/useGamificationNotifications";

import { TaskProvider, useTasks } from "../context/TasksContext";

import { ThemeProvider, useTheme } from "../context/ThemeContext";

import { UserProvider, useUser } from "../context/UserContext";

import { database } from "../database/database";

import "../global.css";

const USER_STORAGE_KEY = "@user_data";

// Configure notification handler

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,

    shouldPlaySound: true,

    shouldSetBadge: true,
  }),
});

// Enable native screen optimizations and freeze offscreen views

enableScreens(true);

enableFreeze(true);

// Enhanced loading component that waits for fonts, user data, and initial tasks load

const UnifiedLoading = ({ children }) => {
  const { colors, isDark } = useTheme();

  const { user, isLoading: isUserLoading } = useUser();

  const { isLoading: isTasksLoading } = useTasks();

  const [fontsLoaded] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),

    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),

    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),

    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),

    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // Wait for all critical loading states

  const isEverythingLoaded = fontsLoaded && !isUserLoading && !isTasksLoading;

  // Show loading screen until everything is ready

  if (!isEverythingLoaded) {
    return (
      <View
        style={{
          flex: 1,

          justifyContent: "center",

          alignItems: "center",

          backgroundColor: isDark ? "#1F2937" : "#FFFBF5",
        }}
      >
        <ActivityIndicator size="100" color={isDark ? "#818CF8" : "#4F46E5"} />

        <Text
          style={{
            marginTop: 16,

            color: isDark ? "#F3F4F6" : "#1F2937",

            fontSize: 16,

            fontFamily: "QuicksandMedium",
          }}
        >
          Loading Schoolify...
        </Text>
      </View>
    );
  }

  return children;
};

function RootLayoutContent() {
  const { user } = useUser();

  const router = useRouter();

  const pathname = usePathname();

  const notificationListener = useRef();

  const responseListener = useRef();

  const systemColorScheme = useColorScheme();

  const { isDark, colors } = useTheme();

  // Handle notification taps

  useEffect(() => {
    // This listener is called when a notification is received while the app is in the foreground

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Notification received
      });

    // This listener is called when a user taps on a notification

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notificationData =
          response.notification.request.content.data || {};

        const { id, type } = notificationData;

        // Notification tapped: { id, type }

        // Handle different notification types

        if (id && type === "task") {
          router.push(`/task-details/${id}`);
        } else if (type === "daily-reminder") {
          router.push("/(tabs)/Home");
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  // Hide Android navigation bar

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");

      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  // Set status bar style based on theme

  useEffect(() => {
    const setStatusBarStyle = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");

        const isDarkTheme =
          savedTheme === "dark" ||
          (!savedTheme && systemColorScheme === "dark");

        if (Platform.OS === "ios") {
          // Use StatusBar for iOS status bar

          StatusBar.setBarStyle(isDarkTheme ? "light-content" : "dark-content");
        } else {
          // Android: Use StatusBar for status bar and NavigationBar for navigation bar

          StatusBar.setBarStyle(isDarkTheme ? "light-content" : "dark-content");

          await NavigationBar.setBackgroundColorAsync(
            isDarkTheme ? "#1F2937" : "#FFFBF5",
          );
        }
      } catch (error) {
        console.error("Failed to set status bar style", error);
      }
    };

    setStatusBarStyle();
  }, []);

  // Direct routing without intermediate loading states

  return (
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      {user ? (
        // IF USER: Only the Home/Tabs stack is available.

        // It's impossible for (auth) to overlay because it isn't rendered.

        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "none", // Remove animation for faster tab switching
          }}
        />
      ) : (
        // IF NO USER: Only the Auth stack is available.

        <Stack.Screen
          name="(auth)"
          options={{
            animation: "fade", // Provides a professional transition
          }}
        />
      )}
    </Stack>
  );
}

const DatabaseWrapper = ({ children }) => {
  return <DatabaseProvider database={database}>{children}</DatabaseProvider>;
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseWrapper>
        <UserProvider>
          <TaskProvider>
            <UnifiedLoading>
              <RootLayoutWrapper />
            </UnifiedLoading>
          </TaskProvider>
        </UserProvider>
      </DatabaseWrapper>
    </ThemeProvider>
  );
}

const GamificationNotificationsWrapper = ({ children }) => {
  // Initialize the gamification notifications hook

  useGamificationNotifications();

  return (
    <>
      {children}

      <NotificationQueue />
    </>
  );
};

const RootLayoutWrapper = () => {
  const { isDark } = useTheme();

  // Update status bar when theme changes

  useEffect(() => {
    if (Platform.OS === "ios") {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    } else {
      // Android: Use StatusBar instead of NavigationBar

      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");

      // Also set navigation bar color if needed

      NavigationBar.setBackgroundColorAsync(isDark ? "#1F2937" : "#FFFBF5");
    }
  }, [isDark]);

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,

        backgroundColor: isDark ? "#1F2937" : "#FFFBF5",
      }}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      <GamificationNotificationsWrapper>
        <RootLayoutContent />
      </GamificationNotificationsWrapper>

      <Toasts
        position="bottom"
        offset={20}
        renderToast={(toast) => (
          <View
            style={{
              width: "90%",

              alignSelf: "center",

              marginBottom: 20,
            }}
          >
            {toast.message}
          </View>
        )}
      />
    </GestureHandlerRootView>
  );
};
