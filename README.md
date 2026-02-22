# Schoolify - Student Task Management App 🎓

A comprehensive task management application designed specifically for students, combining powerful productivity features with gamification to make learning engaging and organized.

## 🚀 Features

### Core Functionality

- **Task Management**: Create, edit, and organize tasks with categories, priorities, and due dates
- **Class Scheduling**: Schedule and manage classes with automatic notifications
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Smart Notifications**: Get timely reminders for tasks and classes
- **Calendar Integration**: View tasks and classes in a unified calendar view

### Gamification System

- **XP & Levels**: Earn experience points and level up by completing tasks
- **Achievements**: Unlock achievements for milestones and consistency
- **Streak Tracking**: Maintain productivity streaks with daily tracking
- **Productivity Score**: Comprehensive scoring based on completion, consistency, and timeliness

### Data Management

- **Local-First Architecture**: WatermelonDB for fast, reliable local storage
- **Cloud Sync**: Appwrite integration for cross-device synchronization
- **Offline Support**: Full functionality without internet connection
- **Intelligent Sync**: Conflict resolution and bidirectional sync

### User Experience

- **Dark/Light Themes**: Beautiful, customizable themes with smooth transitions
- **Responsive Design**: Optimized for both Android and iOS devices
- **Intuitive Navigation**: Bottom tab navigation with floating action button
- **Performance Optimized**: Smooth animations and fast loading

## 🛠 Tech Stack

### Frontend

- **React Native** with **Expo** - Cross-platform mobile development
- **Expo Router** - File-based routing system
- **NativeWind** - Tailwind CSS for React Native
- **Moti** - Smooth animations and transitions

### Backend & Database

- **WatermelonDB** - Reactive local database with SQLite
- **Appwrite** - Backend-as-a-Service for cloud sync and authentication
- **Appwrite Auth** - Secure user authentication

### Key Libraries

- **Expo Notifications** - Local and push notifications
- **React Native Calendars** - Calendar component
- **React Native Gesture Handler** - Smooth gesture interactions
- **Linear Gradient** - Beautiful gradient backgrounds

## 📱 App Structure

### Screens

- **Home**: Dashboard with task overview, progress, and quick actions
- **Tasks**: Comprehensive task management with filtering and sorting
- **Calendar**: Calendar view of tasks and classes
- **AddTask**: Unified form for creating tasks and classes
- **Profile**: User settings and preferences

### Core Components

- **TaskCard**: Reusable task display component
- **GamificationAnalytics**: Achievement and progress tracking
- **NotificationQueue**: Smart notification management
- **ItemForm**: Unified form for tasks and classes

## 🎮 Gamification Features

### Achievement System

- **Milestone Achievements**: First task, 10 tasks, 50 tasks, 100 tasks
- **Priority Achievements**: High-priority task completion milestones
- **Streak Achievements**: 3-day, 7-day, and 30-day streak rewards
- **Rarity Tiers**: Common, Rare, Epic, and Legendary achievements

### Progress Tracking

- **XP System**: 10 XP per task + priority bonuses
- **Level Progress**: 100 XP per level with visual progress bars
- **Productivity Score**: Weighted scoring (40% completion, 30% consistency, 30% timeliness)
- **Personal Records**: Longest streak and most productive day

## 💾 Data Architecture

### Local Storage (WatermelonDB)

- **Tasks**: Core task and class data
- **Categories**: Subject and course categorization
- **Priorities**: Customizable priority levels
- **User Preferences**: Settings and notification preferences

### Cloud Sync (Appwrite)

- **Intelligent Sync**: Only sync changed data to minimize bandwidth
- **Conflict Resolution**: "Last write wins" with timestamp comparison
- **Offline Support**: Full functionality without internet
- **Cross-Device Sync**: Seamless synchronization across devices

## 🔔 Notification System

### Smart Notifications

- **Task Reminders**: Configurable lead times before due dates
- **Class Alerts**: Automatic class start notifications
- **Achievement Unlocks**: Celebratory notifications for achievements
- **Daily Reminders**: Customizable daily task reminders

### Notification Features

- **Permission Management**: Graceful permission requests
- **Channel Configuration**: Android notification channels
- **Custom Sounds**: Default notification sounds
- **Vibration Patterns**: Haptic feedback support

## 🎨 UI/UX Features

### Theme System

- **Dark/Light Modes**: Complete theme support
- **Smooth Transitions**: Animated theme switching
- **Custom Colors**: Consistent color palette
- **Accessibility**: High contrast and readable fonts

### Performance Optimizations

- **Screen Freezing**: Memory optimization for inactive screens
- **Lazy Loading**: Efficient content loading
- **Gesture Optimization**: Smooth gesture handling
- **Animation Performance**: 60fps animations

### Project Structure

```
├── app/                 # Expo Router screens
├── components/          # Reusable UI components
├── context/            # React Context providers
├── database/           # WatermelonDB models and config
├── services/           # External service integrations
├── utils/              # Helper functions and utilities
└── assets/             # Images, fonts, and static assets
```

### Key Files

- `app/_layout.jsx` - Root layout with providers and navigation
- `context/TasksContext.jsx` - Task management state and logic
- `database/database.js` - WatermelonDB configuration
- `services/appwriteSyncService.js` - Cloud synchronization

## 🚀 Deployment

### Expo Development Build

```bash
eas build --profile development --platform all
```

### Production Build

```bash
eas build --profile production --platform all
```

## 🙏 Acknowledgments

- **Expo Team** - Excellent development platform
- **WatermelonDB** - Powerful reactive database
- **Appwrite** - Backend-as-a-Service solution
- **React Native Community** - Amazing ecosystem and libraries
