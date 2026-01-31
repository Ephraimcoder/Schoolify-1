import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import AchievementDetailModal from "./AchievementDetailModal";

// Reuse the streak calculation from TaskProgress
const calculateStreak = (tasks) => {
  const completedTaskList = tasks.filter((task) => task.isCompleted);
  if (completedTaskList.length === 0) return 0;

  const dates = [
    ...new Set(
      completedTaskList
        .map((task) => {
          // Use updatedAt for completion date, fallback to dueDate
          const completionDate = task.updatedAt || task.dueDate;
          return completionDate
            ? new Date(completionDate).toDateString()
            : null;
        })
        .filter(Boolean)
    ),
  ].sort((a, b) => new Date(b) - new Date(a));

  let streakCount = 0;
  const today = new Date().toDateString();

  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    if (dates[i] === expectedDate.toDateString()) {
      streakCount++;
    } else {
      break;
    }
  }
  return streakCount;
};

const GamificationAnalytics = ({ tasks }) => {
  const { isDark } = useTheme();
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const gamificationData = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.isCompleted);
    const totalTasks = tasks.length;

    // Calculate XP (10 XP per completed task, bonus for high priority)
    let xp = completedTasks.length * 10;
    completedTasks.forEach((task) => {
      if (task.priority === "high") xp += 5;
      if (task.priority === "medium") xp += 2;
    });

    // Level calculation (every 100 XP = 1 level)
    const level = Math.floor(xp / 100) + 1;
    const xpToNextLevel = level * 100;
    const currentLevelXP = xp % 100;

    // Achievement system - Show all achievements with unlock status
    const achievements = [];

    // Task-based achievements
    achievements.push({
      id: "first_task",
      name: "First Task",
      icon: "🎯",
      description:
        "Complete your very first task and begin your productivity journey",
      requirement: "Complete 1 task",
      progress: `${Math.min(completedTasks.length, 1)}/1 completed`,
      unlocked: completedTasks.length >= 1,
      rarity: "common",
      category: "milestone",
    });

    achievements.push({
      id: "task_novice",
      name: "Task Novice",
      icon: "🚀",
      description: "Complete 10 tasks and prove your consistency",
      requirement: "Complete 10 tasks",
      progress: `${Math.min(completedTasks.length, 10)}/10 completed`,
      unlocked: completedTasks.length >= 10,
      rarity: "common",
      category: "milestone",
    });

    achievements.push({
      id: "task_master",
      name: "Task Master",
      icon: "👑",
      description: "Complete 50 tasks and become a true productivity master",
      requirement: "Complete 50 tasks",
      progress: `${Math.min(completedTasks.length, 50)}/50 completed`,
      unlocked: completedTasks.length >= 50,
      rarity: "rare",
      category: "milestone",
    });

    achievements.push({
      id: "task_legend",
      name: "Task Legend",
      icon: "🏆",
      description: "Complete 100 tasks and achieve legendary status",
      requirement: "Complete 100 tasks",
      progress: `${Math.min(completedTasks.length, 100)}/100 completed`,
      unlocked: completedTasks.length >= 100,
      rarity: "epic",
      category: "milestone",
    });

    // Priority achievements
    const highPriorityCompleted = completedTasks.filter(
      (task) => task.priority === "high"
    ).length;

    achievements.push({
      id: "priority_pro",
      name: "Priority Pro",
      icon: "⚡",
      description:
        "Complete 10 high-priority tasks and show you can handle the pressure",
      requirement: "Complete 10 high-priority tasks",
      progress: `${Math.min(highPriorityCompleted, 10)}/10 completed`,
      unlocked: highPriorityCompleted >= 10,
      rarity: "rare",
      category: "priority",
    });

    achievements.push({
      id: "priority_master",
      name: "Priority Master",
      icon: "🔥",
      description:
        "Complete 25 high-priority tasks and master the art of urgency",
      requirement: "Complete 25 high-priority tasks",
      progress: `${Math.min(highPriorityCompleted, 25)}/25 completed`,
      unlocked: highPriorityCompleted >= 25,
      rarity: "epic",
      category: "priority",
    });

    // Streak achievements
    const streak = calculateStreak(tasks);

    achievements.push({
      id: "week_streak",
      name: "Week Warrior",
      icon: "🔥",
      description: "Maintain a 3-day streak and build your consistency habit",
      requirement: "Maintain a 3-day streak",
      progress: `${Math.min(streak, 3)}/3 days`,
      unlocked: streak >= 3,
      rarity: "common",
      category: "streak",
    });

    achievements.push({
      id: "week_streak_plus",
      name: "Streak Master",
      icon: "💎",
      description: "Maintain a 7-day streak and achieve true consistency",
      requirement: "Maintain a 7-day streak",
      progress: `${Math.min(streak, 7)}/7 days`,
      unlocked: streak >= 7,
      rarity: "rare",
      category: "streak",
    });

    achievements.push({
      id: "month_streak",
      name: "Consistency King",
      icon: "👑",
      description: "Maintain a 30-day streak and become a consistency legend",
      requirement: "Maintain a 30-day streak",
      progress: `${Math.min(streak, 30)}/30 days`,
      unlocked: streak >= 30,
      rarity: "legendary",
      category: "streak",
    });

    // Productivity Score (0-100)
    const completionRate =
      totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    const consistencyScore = Math.min((streak / 7) * 100, 100); // 7-day streak = 100%
    const timelinessScore = calculateTimelinessScore(completedTasks);

    const productivityScore = Math.round(
      completionRate * 0.4 + consistencyScore * 0.3 + timelinessScore * 0.3
    );

    // Personal bests
    const personalBests = {
      longestStreak: streak,
      mostProductiveDay: getMostProductiveDay(tasks),
    };

    return {
      level,
      xp,
      xpToNextLevel,
      currentLevelXP,
      achievements,
      productivityScore,
      personalBests,
      streak,
    };
  }, [tasks]);

  const handleAchievementPress = (achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementModal(true);
  };

  const handleCloseAchievementModal = () => {
    setShowAchievementModal(false);
    setSelectedAchievement(null);
  };

  function calculateTimelinessScore(completedTasks) {
    if (completedTasks.length === 0) return 0;

    const onTimeTasks = completedTasks.filter((task) => {
      if (!task.dueDate || !task.completedAt) return true;
      return new Date(task.completedAt) <= new Date(task.dueDate);
    });

    return (onTimeTasks.length / completedTasks.length) * 100;
  }

  function getMostProductiveDay(tasks) {
    const dayCount = {};
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    tasks.forEach((task) => {
      if (!task.isCompleted) return;

      // Use the same logic as streak calculation
      const completionDate = task.updatedAt || task.dueDate || task.completedAt;
      if (!completionDate) return;

      try {
        const date = new Date(completionDate);
        if (!isNaN(date.getTime())) {
          // Check if date is valid
          const day = date.getDay();
          dayCount[day] = (dayCount[day] || 0) + 1;
        }
      } catch (e) {
        // Silently handle errors instead of using toast
        console.error("Error processing task date:", e);
      }
    });

    // If no completed tasks, return a helpful message
    if (Object.keys(dayCount).length === 0) {
      return "Complete tasks to see your most productive day";
    }

    // Find the day with the most completed tasks
    const mostProductive = Object.entries(dayCount).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    return days[mostProductive[0]];
  }

  const getLevelTitle = (level) => {
    const titles = {
      1: "Novice",
      2: "Apprentice",
      3: "Journeyman",
      4: "Expert",
      5: "Master",
      6: "Grandmaster",
      7: "Legend",
      8: "Mythic",
      9: "Transcendent",
      10: "Divine",
    };
    return titles[level] || "Transcendent";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return isDark ? "text-green-400" : "text-green-600";
    if (score >= 60) return isDark ? "text-blue-400" : "text-blue-600";
    if (score >= 40) return isDark ? "text-yellow-400" : "text-yellow-600";
    return isDark ? "text-red-400" : "text-red-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <View
      className={`mb-6 rounded-xl p-4 border shadow-sm ${
        isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-100"
      }`}
    >
      <Text
        className={`text-lg font-quicksandBold mb-4 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        Achievements & Progress
      </Text>

      {/* Level Progress */}
      <View
        className={`mb-6 p-4 rounded-lg border ${
          isDark
            ? "bg-purple-900/20 border-purple-700/30"
            : "bg-purple-50 border-purple-200"
        }`}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text
              className={`text-sm font-quicksandMedium ${
                isDark ? "text-purple-300" : "text-purple-700"
              }`}
            >
              Level {gamificationData.level}
            </Text>
            <Text
              className={`text-lg font-quicksandBold ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`}
            >
              {getLevelTitle(gamificationData.level)}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`}
            >
              {gamificationData.xp} XP
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-purple-500" : "text-purple-500"
              }`}
            >
              {gamificationData.xpToNextLevel - gamificationData.currentLevelXP}{" "}
              to next
            </Text>
          </View>
        </View>

        <View
          className={`h-3 rounded-full overflow-hidden ${
            isDark ? "bg-purple-800/30" : "bg-purple-100"
          }`}
        >
          <View
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
            style={{
              width: `${(gamificationData.currentLevelXP / 100) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Productivity Score */}
      <View
        className={`mb-6 p-4 rounded-lg border ${
          isDark
            ? "bg-blue-900/20 border-blue-700/30"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text
            className={`font-quicksandMedium ${
              isDark ? "text-blue-300" : "text-blue-700"
            }`}
          >
            Productivity Score
          </Text>
          <View className="flex-row items-center space-x-2">
            <Text
              className={`text-2xl font-quicksandBold ${getScoreColor(gamificationData.productivityScore)}`}
            >
              {gamificationData.productivityScore}
            </Text>
            <Text
              className={`text-sm font-quicksandMedium ${getScoreColor(gamificationData.productivityScore)}`}
            >
              {getScoreLabel(gamificationData.productivityScore)}
            </Text>
          </View>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Completion (40%)
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {Math.round(
                (tasks.filter((t) => t.isCompleted).length / tasks.length) * 100
              ) || 0}
              %
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Consistency (30%)
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {Math.round(Math.min((gamificationData.streak / 7) * 100, 100))}%
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Timeliness (30%)
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {Math.round(
                calculateTimelinessScore(tasks.filter((t) => t.isCompleted))
              )}
              %
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Achievements */}
      <View className="mb-6">
        <Text
          className={`font-quicksandMedium mb-3 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          All Achievements
        </Text>
        <View className="flex-row flex-wrap">
          {gamificationData.achievements.map((achievement) => {
            const getRarityBorder = (rarity, unlocked) => {
              if (!unlocked) {
                return isDark ? "border-gray-700" : "border-gray-300";
              }
              switch (rarity) {
                case "common":
                  return isDark ? "border-gray-600" : "border-gray-300";
                case "rare":
                  return isDark ? "border-blue-600" : "border-blue-400";
                case "epic":
                  return isDark ? "border-purple-600" : "border-purple-400";
                case "legendary":
                  return isDark ? "border-yellow-600" : "border-yellow-400";
                default:
                  return isDark ? "border-gray-600" : "border-gray-300";
              }
            };

            const getCardBackground = (unlocked) => {
              if (!unlocked) {
                return isDark ? "bg-gray-800" : "bg-gray-100";
              }
              return isDark
                ? "bg-gradient-to-r from-gray-800 to-gray-700"
                : "bg-gradient-to-r from-white to-gray-50";
            };

            return (
              <TouchableOpacity
                key={achievement.id}
                className={`w-[48%] p-3 rounded-lg border shadow-sm mb-3 ${getCardBackground(achievement.unlocked)} ${getRarityBorder(achievement.rarity, achievement.unlocked)}`}
                style={{ marginRight: "2%" }}
                activeOpacity={0.7}
                onPress={() => handleAchievementPress(achievement)}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`text-xl mr-2 ${!achievement.unlocked ? "opacity-50" : ""}`}
                  >
                    {achievement.icon}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className={`text-xs font-quicksandBold ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      } ${!achievement.unlocked ? "opacity-60" : ""}`}
                      numberOfLines={2}
                    >
                      {achievement.name}
                    </Text>
                    {!achievement.unlocked && (
                      <Text
                        className={`text-xs font-quicksand mt-1 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        🔒 {achievement.progress}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {gamificationData.achievements.length === 0 && (
          <Text
            className={`text-sm font-quicksand ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Complete tasks to unlock achievements!
          </Text>
        )}
      </View>

      {/* Personal Bests */}
      <View>
        <Text
          className={`font-quicksandMedium mb-3 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Personal Records
        </Text>
        <View className="space-y-4">
          <View
            className={`p-3 rounded-lg border ${
              isDark
                ? "bg-orange-900/20 border-orange-700/30"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="flame" size={14} color="#F97316" />
              <Text
                className={`text-xs font-quicksandMedium ml-2 ${
                  isDark ? "text-orange-400" : "text-orange-600"
                }`}
              >
                Longest Streak
              </Text>
            </View>
            <Text
              className={`text-lg font-quicksandBold ${
                isDark ? "text-orange-400" : "text-orange-600"
              }`}
            >
              {gamificationData.personalBests.longestStreak}
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              days
            </Text>
          </View>

          <View
            className={`p-3 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={14} color="#3B82F6" />
              <Text
                className={`text-xs font-quicksandMedium ml-2 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Most Productive
              </Text>
            </View>
            <Text
              className={`text-lg font-quicksandBold ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
              numberOfLines={1}
            >
              {gamificationData.personalBests.mostProductiveDay.includes(" ")
                ? gamificationData.personalBests.mostProductiveDay.split(" ")[0]
                : gamificationData.personalBests.mostProductiveDay}
            </Text>
            <Text
              className={`text-xs font-quicksand ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              day
            </Text>
          </View>
        </View>
      </View>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        visible={showAchievementModal}
        achievement={selectedAchievement}
        onClose={handleCloseAchievementModal}
        isDark={isDark}
      />
    </View>
  );
};

export default GamificationAnalytics;
