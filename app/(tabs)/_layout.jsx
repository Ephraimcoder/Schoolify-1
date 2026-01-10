import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
const AddTaskIcon = ({ focused }) => (
  <View style={styles.addTaskContainer}>
    <MaterialCommunityIcons name="plus" size={32} color="white" />
  </View>
);

const TabsLayout = () => {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B47",
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? colors.background[1] : colors.background[0],
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: isDark ? colors.border : "transparent",
          height: 60,
          paddingBottom: 5,
          paddingTop: 10,
        },
        // Performance and transition tweaks
        lazy: false, // Keep screens loaded for faster navigation
        detachInactiveScreens: false, // Prevent screen destruction
        freezeOnBlur: false, // Keep screens responsive
        tabBarHideOnKeyboard: true,
        animationEnabled: true,
        animationTypeForReplace: "push",
        // Add scene container style to prevent white flash
        sceneStyle: {
          backgroundColor: isDark ? colors.background[0] : colors.background[0],
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="tasks" size={size} color={color} />
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
            <Ionicons
              name="calendar-number-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  addTaskContainer: {
    backgroundColor: "#FF6B47",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20, // Elevate the button
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
