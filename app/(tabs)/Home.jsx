import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  return (
    <ScreenAnimation duration={400}>
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView className="flex-1 px-6 mt-2">
          {/* Header Section */}
          <View className="flex-row items-center justify-between mt-6 mb-6">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-16 h-16 rounded-2xl mr-4 border-2 border-white shadow-sm"
                />
              </View>
              <View>
                <Text
                  className={`text-gray-500 font-quicksand text-sm ${isDark ? "text-gray-400" : ""}`}
                >
                  {greeting} 👋
                </Text>
                <Text
                  className={`text-xl font-bold font-quicksandBold ${isDark ? "text-gray-100" : "text-gray-800"}`}
                >
                  {user?.name || "Welcome back"}
                </Text>
              </View>
            </View>

            {/* Network Status Indicator */}
            <View
              className={`px-3 py-1 rounded-full ${isOnline ? "bg-green-100" : "bg-yellow-100"}`}
            >
              <Text
                className={`text-xs font-quicksandMedium ${isOnline ? "text-green-700" : "text-yellow-700"}`}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          {/* <View className="mb-6">
            <SearchBar />
          </View> */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Progress Section */}
            <View className="mb-6">
              <TaskProgress />
            </View>

            {/* Tasks Section */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-lg font-quicksandBold ${isDark ? "text-gray-100" : "text-gray-800"}`}
                >
                  Upcoming Tasks
                </Text>
                <TouchableOpacity onPress={() => router.push("/Tasks")}>
                  <Text className="text-indigo-600 font-quicksandMedium">
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              <TasksSection />
            </View>

            {/* Classes Section */}
            <View>
              <ClassesSection />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ScreenAnimation>
  );
};

export default Home;
