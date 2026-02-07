import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import AchievementUnlockNotification from "./AchievementUnlockNotification";
import LevelUpNotification from "./LevelUpNotification";

const NOTIFICATION_TYPES = {
  ACHIEVEMENT: "achievement",
  LEVEL_UP: "level_up",
};

const NOTIFICATION_DURATION = {
  ACHIEVEMENT: 5000, // 5 seconds
  LEVEL_UP: 5000, // 5 seconds
};

const NotificationQueue = () => {
  const [queue, setQueue] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const timersRef = useRef(new Map()); // Store timers by notification ID

  // Add notification to queue
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random(); // Unique ID
    const newNotification = {
      id,
      type: notification.type,
      data: notification.data,
      timestamp: Date.now(),
      duration:
        notification.duration || NOTIFICATION_DURATION[notification.type],
    };

    setQueue((prev) => [...prev, newNotification]);
  }, []);

  // Remove notification from queue and active notifications
  const removeNotification = useCallback((id) => {
    // Clear the timer if it exists
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }

    setQueue((prev) => prev.filter((notif) => notif.id !== id));
    setActiveNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Process queue - move notifications to active state
  useEffect(() => {
    if (queue.length > 0 && activeNotifications.length < 3) {
      // Max 3 simultaneous
      const nextNotification = queue[0];
      setActiveNotifications((prev) => [...prev, nextNotification]);
      setQueue((prev) => prev.slice(1));

      // Auto-remove after duration
      const timer = setTimeout(() => {
        removeNotification(nextNotification.id);
      }, nextNotification.duration);

      // Store the timer
      timersRef.current.set(nextNotification.id, timer);
    }
  }, [queue, activeNotifications.length, removeNotification]);

  // Handle notification close
  const handleClose = useCallback(
    (id) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  // Expose method to add notifications globally
  useEffect(() => {
    // Make this available globally for other components
    global.addNotification = addNotification;

    return () => {
      delete global.addNotification;
    };
  }, [addNotification]);

  // Render active notifications
  const renderNotification = (notification, index) => {
    const { type, data, id } = notification;

    switch (type) {
      case NOTIFICATION_TYPES.ACHIEVEMENT:
        return (
          <AchievementUnlockNotification
            key={id}
            achievement={data}
            visible={true}
            onClose={() => handleClose(id)}
            index={index}
          />
        );

      case NOTIFICATION_TYPES.LEVEL_UP:
        return (
          <LevelUpNotification
            key={id}
            levelData={data}
            visible={true}
            onClose={() => handleClose(id)}
            index={index}
          />
        );

      default:
        return null;
    }
  };

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <View className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      {activeNotifications.map((notification, index) => (
        <View key={notification.id} className="pointer-events-auto">
          {renderNotification(notification, index)}
        </View>
      ))}
    </View>
  );
};

// Helper functions to easily create notifications
export const createAchievementNotification = (achievement) => ({
  type: NOTIFICATION_TYPES.ACHIEVEMENT,
  data: achievement,
  duration: NOTIFICATION_DURATION.ACHIEVEMENT,
});

export const createLevelUpNotification = (levelData) => ({
  type: NOTIFICATION_TYPES.LEVEL_UP,
  data: levelData,
  duration: NOTIFICATION_DURATION.LEVEL_UP,
});

// Global helper to add notifications from anywhere
export const showAchievementUnlock = (achievement) => {
  if (global.addNotification) {
    global.addNotification(createAchievementNotification(achievement));
  }
};

export const showLevelUp = (levelData) => {
  if (global.addNotification) {
    global.addNotification(createLevelUpNotification(levelData));
  }
};

export default NotificationQueue;
