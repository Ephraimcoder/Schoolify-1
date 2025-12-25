import { Toasts } from "@backpackapp-io/react-native-toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze, enableScreens } from "react-native-screens";
import { TaskProvider } from "../context/TasksContext";
import { UserProvider, useUser } from "../context/UserContext";
import "../global.css";

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

// Keep the native splash up until we finish auth/onboarding routing
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const notificationListener = useRef();
  const responseListener = useRef();
  const splashHiddenRef = useRef(false);
  const targetPathRef = useRef(null);

  const hideSplash = () => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  };

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
        if (
          id &&
          type === "task" &&
          !pathname.includes(`/task-details/${id}`)
        ) {
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
  }, [pathname, router]);

  // Hide Android navigation bar
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    const checkAndRoute = async () => {
      // If we have a user, immediately route to Home and skip async checks.
      if (user) {
        if (!cancelled) {
          targetPathRef.current = "/(tabs)/Home";
          router.replace(targetPathRef.current);
        }
        return;
      }

      // Otherwise, check connection and onboarding flag
      const [netState, onboardingSeen] = await Promise.all([
        NetInfo.fetch(),
        AsyncStorage.getItem("onboarding_seen"),
      ]);

      if (cancelled) return;

      if (!netState.isConnected) {
        // Offline and no cached user: route within auth, preserve offline param
        if (onboardingSeen === "true") {
          targetPathRef.current = "/(auth)/sign-in";
          router.replace({
            pathname: targetPathRef.current,
            params: { offline: "true" },
          });
        } else {
          targetPathRef.current = "/(auth)";
          router.replace({
            pathname: targetPathRef.current,
            params: { offline: "true" },
          });
        }
      } else {
        // Online but no user yet
        if (onboardingSeen === "true") {
          targetPathRef.current = "/(auth)/sign-in";
          router.replace(targetPathRef.current);
        } else {
          targetPathRef.current = "/(auth)";
          router.replace(targetPathRef.current);
        }
      }
    };

    checkAndRoute();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router]);

  // Only hide the splash once the router has actually navigated to the intended path
  useEffect(() => {
    const target = targetPathRef.current;
    if (!target) return;
    // If pathname equals the target (or begins with it for dynamic segments), hide the splash
    if (pathname === target || pathname.startsWith(target)) {
      hideSplash();
      targetPathRef.current = null;
    }
  }, [pathname]);

  // Main app layout
  return (
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

const AppLoader = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="100" />
    </View>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // Keep the native splash on-screen until fonts are loaded; we hide it in routing above
  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserProvider>
      <TaskProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
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
      </TaskProvider>
    </UserProvider>
  );
}
