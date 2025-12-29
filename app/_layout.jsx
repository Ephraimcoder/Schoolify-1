import { Toasts } from "@backpackapp-io/react-native-toast";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze, enableScreens } from "react-native-screens";
import { TaskProvider } from "../context/TasksContext";
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

function RootLayoutContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const notificationListener = useRef();
  const responseListener = useRef();

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

  // 1. THE GATEKEEPER
  // While initializing (AsyncStorage + Appwrite), show the loader.
  // We do NOT render the Stack yet. This prevents the "Auth" screens
  // from mounting by default during the dev refresh.
  if (isLoading) {
    return <SplashScreen />;
  }

  // 2. THE SOURCE OF TRUTH (Declarative Routing)
  // We use a ternary operator to swap the stack contents.
  // When 'user' exists, (auth) is physically removed from the component tree.
  return (
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      {user ? (
        // IF USER: Only the Home/Tabs stack is available.
        // It's impossible for (auth) to overlay because it isn't rendered.
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "fade", // Provides a professional transition
          }}
        />
      ) : (
        // IF NO USER: Only the Auth stack is available.
        <Stack.Screen
          name="(auth)"
          options={{
            animation: "fade",
          }}
        />
      )}
    </Stack>
  );
}

const SplashScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="100" />
    </View>
  );
};

const DatabaseWrapper = ({ children }) => {
  return <DatabaseProvider database={database}>{children}</DatabaseProvider>;
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // Show loading spinner only during initial font loading, not auth
  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  // Don't show any loading screen for auth - let routing handle it
  return (
    <UserProvider>
      <DatabaseWrapper>
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
      </DatabaseWrapper>
    </UserProvider>
  );
}
