import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClassesSection from "../../components/ClassesSection";
import TaskProgress from "../../components/TaskProgress";
import TasksSection from "../../components/TasksSection";
import { useUser } from "../../context/UserContext";

const Home = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const date = new Date();
  const { user, isLoading } = useUser();
  const hours = date.getUTCHours();

  let greeting;
  if (hours < 12) {
    greeting = "Good morning";
  } else if (hours < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const router = useRouter();
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={["#FFFBF5", "#FEFBF6"]} className="flex-1">
        <SafeAreaView className="flex-1 px-6 mt-2">
          {/* Header Section */}
          <View className="flex-row items-center justify-between mt-6 mb-6">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      "https://ui-avatars.com/api/?name=" +
                        (user?.name || "User") +
                        "&background=4F46E5&color=fff",
                  }}
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
    </Animated.View>
  );
};

export default Home;
