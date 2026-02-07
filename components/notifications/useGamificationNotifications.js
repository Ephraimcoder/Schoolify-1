import { useEffect, useRef, useState } from "react";
import { useTasks } from "../../context/TasksContext";
import { showAchievementUnlock, showLevelUp } from "./NotificationQueue";

// Helper function to calculate gamification data (copied from GamificationAnalytics)
const calculateGamificationData = (tasks) => {
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

  return {
    level,
    xp,
    xpToNextLevel,
    currentLevelXP,
    achievements,
    streak,
  };
};

// Streak calculation helper
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

const useGamificationNotifications = () => {
  const { tasks } = useTasks();
  const previousStateRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Skip first run (initialization)
    if (!isInitialized) {
      setIsInitialized(true);
      previousStateRef.current = calculateGamificationData(tasks);
      return;
    }

    const currentState = calculateGamificationData(tasks);
    const previousState = previousStateRef.current;

    if (!previousState) {
      previousStateRef.current = currentState;
      return;
    }

    // Check for level up
    if (currentState.level > previousState.level) {
      showLevelUp({
        level: currentState.level,
        xp: currentState.xp,
        currentLevelXP: currentState.currentLevelXP,
        xpToNextLevel: currentState.xpToNextLevel,
      });
    }

    // Check for newly unlocked achievements
    currentState.achievements.forEach((achievement) => {
      const previousAchievement = previousState.achievements.find(
        (prev) => prev.id === achievement.id
      );

      // If achievement is now unlocked but was previously locked
      if (
        achievement.unlocked &&
        previousAchievement &&
        !previousAchievement.unlocked
      ) {
        // Add small delay to avoid overlapping with level up notifications
        setTimeout(() => {
          showAchievementUnlock(achievement);
        }, 500);
      }
    });

    // Update previous state
    previousStateRef.current = currentState;
  }, [tasks, isInitialized]);

  // Return current gamification state for reference
  const getCurrentGamificationData = () => {
    return calculateGamificationData(tasks);
  };

  return {
    getCurrentGamificationData,
  };
};

export default useGamificationNotifications;
