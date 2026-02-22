import {
  Feather,
  FontAwesome5,
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
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 15,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        // Performance and transition tweaks
        lazy: false, // Keep screens loaded for faster navigation
        detachInactiveScreens: false, // Prevent screen destruction
        freezeOnBlur: false, // Keep screens responsive
        tabBarHideOnKeyboard: true,
        animationEnabled: true,
        animationTypeForReplace: "push",
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
            <FontAwesome5 name="tasks" size={22} color={color} />
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TabsLayout;
