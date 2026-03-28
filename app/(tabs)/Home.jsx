import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClassesSection from "../../components/ClassesSection";
import ScreenAnimation from "../../components/ScreenAnimation";
import TaskProgress from "../../components/TaskProgress";
import TasksSection from "../../components/TasksSection";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const Home = () => {
  const { user, isLoading } = useUser();
  const { isDark, colors } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

  // Memoize date calculations to prevent re-calculation on every render
  const dateInfo = useMemo(() => {
    const date = new Date();
    const hours = date.getUTCHours();
    return { date, hours };
  }, []); // Only calculate once on mount

  // Memoize greeting calculation
  const greeting = useMemo(() => {
    const { hours } = dateInfo;
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, [dateInfo.hours]);

  // Optimize network status monitoring
  const handleNetworkChange = useCallback((state) => {
    setIsOnline(state.isConnected);
  }, []);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);
    };

    checkNetworkStatus();
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => unsubscribe();
  }, [handleNetworkChange]);

  const avatarUrl = useMemo(() => {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4F46E5&color=fff`
    );
  }, [user?.avatar, user?.name]);

  const router = useRouter();

  // Calculate today's task count for the title
  const todayTaskCount = useMemo(() => {
    // This would ideally come from TasksContext but for now we'll keep it simple
    return 0; // This will be updated when we integrate with TasksContext
  }, []);

  // Safe navigation function
  const navigateSafely = useCallback(
    (path) => {
      try {
        if (router && router.push) {
          router.push(path);
        }
      } catch (error) {
        console.warn("Navigation error:", error);
      }
    },
    [router],
  );
  return (
    <ScreenAnimation duration={400}>
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView className="flex-1 px-4 mt-2">
          {/* Header Section - More Compact */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <View className="flex-row items-center flex-1">
              <View className="relative">
                <View className="w-1 h-10 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full absolute -left-1 top-1" />
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-12 h-12 rounded-xl mr-3 border-2 border-white/20 shadow-md"
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-xs font-quicksandMedium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {greeting} 👋
                </Text>
                <Text
                  className={`text-xl font-quicksandBold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {user?.name || "Welcome back"}
                </Text>
              </View>
            </View>

            {/* Network Status Indicator - Smaller */}
            <View
              className={`px-2 py-1 rounded-full flex-row items-center ${
                isOnline ? "bg-green-500/20" : "bg-amber-500/20"
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  isOnline ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              <Text
                className={`text-xs font-quicksandSemiBold ${
                  isOnline ? "text-green-600" : "text-amber-600"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            className="flex-1"
          >
            {/* Progress Section - Reduced margin */}
            <View className="mb-4">
              <TaskProgress />
            </View>

            {/* Tasks Section - Reduced margin */}
            <View className="mb-6">
              <TasksSection />
            </View>

            {/* Classes Section - Reduced margin */}
            <View className="mb-4">
              <ClassesSection />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ScreenAnimation>
  );
};

export default Home;
