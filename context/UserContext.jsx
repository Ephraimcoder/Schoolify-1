import { Q } from "@nozbe/watermelondb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
} from "react-native-appwrite";
import { database } from "../database/database";
const USER_STORAGE_KEY = "@user_data";
const LOGOUT_PENDING_KEY = "@logout_pending";
const LAST_SESSION_CHECK_KEY = "@last_session_check";
const SESSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const platform = "com.jms.schoolify";
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const userCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID;
const tasksCollectionId = process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID;

const appwriteConfig = {
  endpoint: endpoint,
  projectId: projectId,
  platform: platform,
  databaseId: databaseId,
  userCollectionId: userCollectionId,
  tasksCollectionId: tasksCollectionId,
};

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const avatars = new Avatars(client);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchUserDocument = async (accountId) => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", accountId)]
      );

      if (response.documents.length === 0) {
        throw new Error("User document not found");
      }

      const userDoc = response.documents[0];
      return {
        $id: userDoc.$id,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
        accountId: userDoc.accountId,
      };
    } catch (error) {
      console.error("Failed to fetch user document:", error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadAndValidateUser = async () => {
      try {
        // 1. Load from local storage
        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const lastSessionCheck = await AsyncStorage.getItem(
          LAST_SESSION_CHECK_KEY
        );
        const now = Date.now();

        const shouldCheckSession =
          !lastSessionCheck ||
          now - parseInt(lastSessionCheck) > SESSION_CHECK_INTERVAL;

        let currentUserData = null;

        if (cachedUser) {
          currentUserData = JSON.parse(cachedUser);

          // If cache is fresh, verify session matches cached user (only every 24 hours)
          if (!shouldCheckSession) {
            // Skip session check - use cached data
            if (mounted) {
              setUser(currentUserData);
              setIsLoading(false);
            }
            return;
          }

          // Check session (only every 24 hours)
          try {
            const currentAccount = await account.get();
            await AsyncStorage.setItem(LAST_SESSION_CHECK_KEY, now.toString());

            if (
              currentAccount &&
              currentAccount.$id !== currentUserData.accountId
            ) {
              // Session user doesn't match cached user - clear cache
              console.log("Session user mismatch, clearing cache");
              await clearUser();
              currentUserData = null;
              if (mounted) {
                setIsLoading(false);
              }
              return;
            } else if (!currentAccount) {
              // No session - clear cache
              await clearUser();
              currentUserData = null;
              if (mounted) {
                setIsLoading(false);
              }
              return;
            }
          } catch (sessionError) {
            // Can't get session - clear cache for safety
            await clearUser();
            currentUserData = null;
            if (mounted) {
              setIsLoading(false);
            }
            return;
          }

          if (mounted) {
            setUser(currentUserData);
            setIsLoading(false);
          }
          return;
        }

        // 3. FINAL STEP: Update user state
        if (mounted) {
          setUser(currentUserData);
        }
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAndValidateUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Save user to AsyncStorage
  const saveUser = async (userData) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user data", error);
    }
  };

  // Clear user from AsyncStorage
  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_SESSION_CHECK_KEY);
      setUser(null);
      // Also try to clear any existing sessions for security
      try {
        await account.deleteSessions();
      } catch (sessionError) {
        // Ignore session errors - might already be cleared
      }
    } catch (error) {
      throw new Error("Failed to clear user data");
    }
  };

  const login = async (email, password) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    setIsLoading(true);
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const userData = await fetchUserDocument(session.userId);
      await saveUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      await clearUser();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailOtp = async (
    email,
    { phrase = false, userId, isSignup = false } = {}
  ) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    try {
      const desiredId = userId ?? ID.unique();
      // Returns Token with userId (and optional phrase if enabled)
      const token = await account.createEmailToken(desiredId, email, phrase);
      return { userId: token.userId, phrase: token.phrase, isSignup };
    } catch (error) {
      console.error("requestEmailOtp error:", error);
      // Re-throw a friendly message
      throw new Error(
        error?.message || "Failed to send OTP. Please try again."
      );
    }
  };

  const verifyEmailOtp = async ({
    userId,
    code,
    isSignup = false,
    email,
    password,
    name,
  }) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    setIsLoading(true);
    try {
      if (isSignup) {
        // For signup: create account first, then verify with OTP
        const newAccount = await account.create(userId, email, password, name);

        // Create session with OTP to verify
        await account.createSession({ userId, secret: code });

        // Create user document
        const avatarUrl = avatars.getInitialsURL(name);
        const newDoc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          ID.unique(),
          {
            accountId: newAccount.$id,
            name: name,
            email: email,
            avatar: avatarUrl,
          }
        );

        const userData = {
          $id: newDoc.$id,
          name: newDoc.name,
          email: newDoc.email,
          avatar: newDoc.avatar,
          accountId: newDoc.accountId,
        };

        await saveUser(userData);
        return userData;
      } else {
        // For login: existing OTP flow
        await account.createSession({ userId, secret: code });
      }

      // Get the authenticated account
      const currentAccount = await account.get();

      // Try fetching user document; if missing, create it (first sign-in)
      let userData;
      try {
        userData = await fetchUserDocument(currentAccount.$id);
      } catch (err) {
        // Create minimal profile (shouldn't happen for signup, but fallback)
        const fallbackName =
          currentAccount.name && currentAccount.name.trim().length > 0
            ? currentAccount.name
            : currentAccount.email?.split("@")[0] || "User";
        const avatarUrl = avatars.getInitialsURL(fallbackName);
        const newDoc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          ID.unique(),
          {
            accountId: currentAccount.$id,
            name: fallbackName,
            email: currentAccount.email,
            avatar: avatarUrl,
          }
        );
        userData = {
          $id: newDoc.$id,
          name: newDoc.name,
          email: newDoc.email,
          avatar: newDoc.avatar,
          accountId: newDoc.accountId,
        };
      }

      await saveUser(userData);
      return userData;
    } catch (error) {
      console.error("verifyEmailOtp error:", error);
      throw new Error(
        error?.message || "Invalid or expired code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear local state
      setUser(null);
      await clearUser();

      // Try to revoke session
      try {
        await account.deleteSessions();
      } catch (e) {
        console.log("Could not revoke session, will retry on next app start");
      }

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const isLoggedIn = () => {
    return user !== null;
  };

  const deleteAccount = async (password) => {
    try {
      // 1. Delete all user's tasks from Appwrite remote database
      const tasksResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.tasksCollectionId,
        [Query.equal("user_id", user.accountId)]
      );

      if (tasksResponse.documents.length > 0) {
        for (const taskDoc of tasksResponse.documents) {
          await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tasksCollectionId,
            taskDoc.$id
          );
        }
      }

      // 2. Delete all user's tasks from local database
      const tasksCollection = database.collections.get("tasks");
      const userTasks = await tasksCollection
        .query(Q.where("user_id", user.accountId))
        .fetch();

      if (userTasks.length > 0) {
        await database.write(async () => {
          for (const task of userTasks) {
            await task.markAsDeleted();
          }
        });
      }

      // 3. Delete user document from database
      try {
        await databases.deleteDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          user.$id
        );
      } catch (error) {
        if (error.code !== 404) {
          throw error; // Re-throw if it's not a "not found" error
        }
      }

      // 4. Delete the account session
      await account.deleteSession("current");
      // Note: Appwrite doesn't have a direct deleteAccount method in the client SDK
      // The account deletion should be handled server-side or via additional API calls

      // 5. Clear local storage and state
      await clearUser();
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error("Error deleting account:", error);
      throw new Error("Failed to delete account. Please try again later.");
    }
  };

  const value = {
    user,
    isLoading,
    isOffline,
    login,
    logout,
    isLoggedIn,
    deleteAccount,
    requestEmailOtp,
    verifyEmailOtp,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
