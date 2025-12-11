import { Toasts } from "@backpackapp-io/react-native-toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze, enableScreens } from "react-native-screens";
import { TaskProvider } from "../context/TasksContext";
import { UserProvider, useUser } from "../context/UserContext";
import "../global.css";

// Enable native screen optimizations and freeze offscreen views
enableScreens(true);
enableFreeze(true);

function RootLayoutContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();

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
        if (!cancelled) router.replace("/(tabs)/Home");
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
          router.replace({
            pathname: "/(auth)/sign-in",
            params: { offline: "true" },
          });
        } else {
          router.replace({ pathname: "/(auth)", params: { offline: "true" } });
        }
      } else {
        // Online but no user yet
        if (onboardingSeen === "true") {
          router.replace("/(auth)/sign-in");
        } else {
          router.replace("/(auth)");
        }
      }
    };

    checkAndRoute();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router]);

  // Main app layout
  return (
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  if (!fontsLoaded) {
    return <SplashScreen />;
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
