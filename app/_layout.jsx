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
  useColorScheme,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze, enableScreens } from "react-native-screens";
import { TaskProvider } from "../context/TasksContext";
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

// Simplified loading component - providers handle their own loading states
const UnifiedLoading = ({ children }) => {
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // Simple loading state - just wait for fonts
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background[0],
        }}
      >
        <ActivityIndicator size="100" color={colors.text} />
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
        console.log("Notification received:", notification);
      });

    // This listener is called when a user taps on a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notificationData =
          response.notification.request.content.data || {};
        const { id, type } = notificationData;

        console.log("Notification tapped:", { id, type });

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
          if (isDarkTheme) {
            NavigationBar.setBarStyleAsync("dark-content");
          } else {
            NavigationBar.setBarStyleAsync("light-content");
          }
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
      <UserProvider>
        <UnifiedLoading>
          <DatabaseWrapper>
            <TaskProvider>
              <RootLayoutWrapper />
            </TaskProvider>
          </DatabaseWrapper>
        </UnifiedLoading>
      </UserProvider>
    </ThemeProvider>
  );
}

const RootLayoutWrapper = () => {
  const { isDark } = useTheme();

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#1F2937" : "#FFFBF5",
      }}
    >
      <RootLayoutContent />
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
