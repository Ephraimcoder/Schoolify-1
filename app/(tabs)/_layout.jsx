import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
const AddTaskIcon = ({ focused }) => (
  <View style={styles.addTaskContainer}>
    <MaterialCommunityIcons name="plus" size={24} color="white" />
  </View>
);

const TabsLayout = () => {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B47",
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 10,
          left: 20,
          right: 20,
          height: 50,
          backgroundColor: isDark ? "#1F2937" : colors.background[0],
          borderRadius: 25,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDark ? "#374151" : "rgba(0, 0, 0, 0.1)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        // Performance and transition tweaks
        lazy: true, // Unload screens when not visible (saves memory)
        detachInactiveScreens: false, // Destroy inactive screens (saves memory)
        freezeOnBlur: true, // Freeze inactive screens (saves CPU/memory)
        tabBarHideOnKeyboard: true,
        animationEnabled: false, // Disable animations for performance
        animationTypeForReplace: "push", // Animation when replacing tabs

        // Tab transition animation options:
        // For iOS: slide_from_left, slide_from_right, fade, none
        // For Android: fade, none (slide animations not supported on Android tabs)

        // Add scene container style to prevent white flash and create space for floating tab bar
        sceneStyle: {
          backgroundColor: isDark ? "#111827" : colors.background[0],
          paddingBottom: 70, // Create space for floating tab bar
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AddTask"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => <AddTaskIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  addTaskContainer: {
    backgroundColor: "#FF6B47",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11, // Elevate button
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default TabsLayout;
