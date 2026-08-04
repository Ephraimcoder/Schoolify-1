import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  colors: {},
});

const lightColors = {
  background: ["#E8E4E0", "#E0DCD8"],
  card: "#F0EDE9",
  text: "#374151",
  textSecondary: "#6B7280",
  border: "#D1D5DB",
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  gray: "#9CA3AF",
};

const darkColors = {
  background: ["#1F2937", "#111827"],
  card: "#374151",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  border: "#4B5563",
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  gray: "#6B7280",
};

export const ThemeProvider = ({ children }) => {
  // Combine useState calls to maintain consistent order
  const [isDark, setIsDark] = useState(true); // Hardcode dark mode
  const [isThemeLoading, setIsThemeLoading] = useState(false);

  // Load saved theme preference (for production)
  useEffect(() => {
    const loadTheme = async () => {
      setIsThemeLoading(true);
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setIsDark(savedTheme === "dark");
        }
      } catch (error) {
        console.error("Failed to load theme preference", error);
      } finally {
        setIsThemeLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.error("Failed to save theme preference", error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  // Show loading indicator while theme loads
  if (isThemeLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1F2937",
        }}
      >
        <ActivityIndicator size="large" color="#F9FAFB" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
