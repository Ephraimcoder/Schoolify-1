import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { showAchievementUnlock, showLevelUp } from "./NotificationQueue";

const NotificationTest = () => {
  const { isDark } = useTheme();

  const testAchievements = [
    {
      id: "first_task",
      name: "First Task",
      icon: "🎯",
      description:
        "Complete your very first task and begin your productivity journey",
      requirement: "Complete 1 task",
      progress: "1/1 completed",
      unlocked: true,
      rarity: "common",
      category: "milestone",
    },
    {
      id: "task_novice",
      name: "Task Novice",
      icon: "🚀",
      description: "Complete 10 tasks and prove your consistency",
      requirement: "Complete 10 tasks",
      progress: "10/10 completed",
      unlocked: true,
      rarity: "common",
      category: "milestone",
    },
    {
      id: "priority_pro",
      name: "Priority Pro",
      icon: "⚡",
      description:
        "Complete 10 high-priority tasks and show you can handle the pressure",
      requirement: "Complete 10 high-priority tasks",
      progress: "10/10 completed",
      unlocked: true,
      rarity: "rare",
      category: "priority",
    },
    {
      id: "task_legend",
      name: "Task Legend",
      icon: "🏆",
      description: "Complete 100 tasks and achieve legendary status",
      requirement: "Complete 100 tasks",
      progress: "100/100 completed",
      unlocked: true,
      rarity: "epic",
      category: "milestone",
    },
    {
      id: "month_streak",
      name: "Consistency King",
      icon: "👑",
      description: "Maintain a 30-day streak and become a consistency legend",
      requirement: "Maintain a 30-day streak",
      progress: "30/30 days",
      unlocked: true,
      rarity: "legendary",
      category: "streak",
    },
  ];

  const testLevels = [
    { level: 2, xp: 150, currentLevelXP: 50, xpToNextLevel: 200 },
    { level: 5, xp: 450, currentLevelXP: 50, xpToNextLevel: 500 }, // Milestone
    { level: 10, xp: 950, currentLevelXP: 50, xpToNextLevel: 1000 }, // Milestone
  ];

  const handleShowAchievement = (achievement) => {
    showAchievementUnlock(achievement);
  };

  const handleShowLevelUp = (levelData) => {
    showLevelUp(levelData);
  };

  return (
    <ScrollView
      className={`flex-1 p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <Text
        className={`text-2xl font-bold mb-6 ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Notification Test Panel
      </Text>

      {/* Achievement Tests */}
      <View className="mb-6">
        <Text
          className={`text-lg font-semibold mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}
        >
          Test Achievement Notifications
        </Text>
        {testAchievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            className={`p-3 rounded-lg mb-2 border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
            onPress={() => handleShowAchievement(achievement)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">{achievement.icon}</Text>
              <View className="flex-1">
                <Text
                  className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
                >
                  {achievement.name}
                </Text>
                <Text
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {achievement.rarity} • {achievement.category}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Level Up Tests */}
      <View className="mb-6">
        <Text
          className={`text-lg font-semibold mb-3 ${isDark ? "text-gray-200" : "text-gray-800"}`}
        >
          Test Level Up Notifications
        </Text>
        {testLevels.map((levelData) => (
          <TouchableOpacity
            key={levelData.level}
            className={`p-3 rounded-lg mb-2 border ${
              isDark
                ? "bg-purple-900/30 border-purple-700"
                : "bg-purple-50 border-purple-300"
            }`}
            onPress={() => handleShowLevelUp(levelData)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">⚡</Text>
              <View className="flex-1">
                <Text
                  className={`font-semibold ${isDark ? "text-purple-300" : "text-purple-700"}`}
                >
                  Level {levelData.level}{" "}
                  {levelData.level % 5 === 0 ? "🎉" : ""}
                </Text>
                <Text
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {levelData.xp} XP • {levelData.currentLevelXP}/100 to next
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Instructions */}
      <View
        className={`p-4 rounded-lg ${isDark ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-300"}`}
      >
        <Text
          className={`text-sm font-semibold mb-2 ${isDark ? "text-blue-300" : "text-blue-700"}`}
        >
          How to Test:
        </Text>
        <Text
          className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
        >
          1. Tap any achievement button to see achievement unlock notification
          {"\n"}2. Tap any level button to see level up notification
          {"\n"}3. Notice milestone levels (5, 10) have special effects
          {"\n"}4. Multiple notifications will queue and display sequentially
        </Text>
      </View>
    </ScrollView>
  );
};

export default NotificationTest;
