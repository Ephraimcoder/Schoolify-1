import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClassesSection from "../../components/ClassesSection";
import ScreenAnimation from "../../components/ScreenAnimation";
import TaskProgress from "../../components/TaskProgress";
import TasksSection from "../../components/TasksSection";
import { useUser } from "../../context/UserContext";
const Home = () => {
  const date = new Date();
  const { user, isLoading } = useUser();
  const [isOnline, setIsOnline] = useState(true);
  const hours = date.getUTCHours();

  // Monitor network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);
    };

    checkNetworkStatus();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const greeting = useMemo(() => {
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  }, [hours]);

  const avatarUrl = useMemo(() => {
    return (
      user?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4F46E5&color=fff`
    );
  }, [user?.avatar, user?.name]);

  const router = useRouter();
  return (
    <ScreenAnimation duration={400}>
      <LinearGradient colors={["#FFFBF5", "#FEFBF6"]} className="flex-1">
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
                <Text className="text-gray-500 font-quicksand text-sm">
                  {greeting} 👋
                </Text>
                <Text className="text-xl font-bold text-gray-800 font-quicksandBold">
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
                <Text className="text-lg font-quicksandBold text-gray-800">
                  Today's Tasks
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
