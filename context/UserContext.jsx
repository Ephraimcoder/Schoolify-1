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

const USER_STORAGE_KEY = "@user_data";
const LOGOUT_PENDING_KEY = "@logout_pending";
const LAST_VALIDATION_KEY = "@last_validation";
const VALIDATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  platform: "com.jms.schoolify",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
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
    const loadAndValidateUser = async () => {
      try {
        // 1. Load from local storage
        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const lastValidation = await AsyncStorage.getItem(LAST_VALIDATION_KEY);
        const now = Date.now();
        const shouldValidate =
          !lastValidation ||
          now - parseInt(lastValidation) > VALIDATION_INTERVAL;

        let currentUserData = null;

        if (cachedUser) {
          currentUserData = JSON.parse(cachedUser);
          setUser(currentUserData);

          // If cache is fresh, skip validation
          if (!shouldValidate) {
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);

        // 2. Validate with Appwrite (only if cache is old or missing)
        try {
          const currentAccount = await account.get();
          if (currentAccount) {
            const userData = await fetchUserDocument(currentAccount.$id);
            await saveUser(userData);
            await AsyncStorage.setItem(LAST_VALIDATION_KEY, now.toString());
            currentUserData = userData;
          } else {
            await clearUser();
            currentUserData = null;
          }
        } catch (error) {
          // Handle specific expiration errors
          if (error?.code === 401) {
            // Appwrite unauthorized
            await clearUser();
            currentUserData = null;
          }
          // For network errors, we keep the currentUserData we got from cache
        }

        // 3. FINAL STEP: Update user state
        setUser(currentUserData);
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndValidateUser();
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
      await AsyncStorage.removeItem(LAST_VALIDATION_KEY);
      setUser(null);
    } catch (error) {
      throw new Error();
    }
  };
  const register = async (email, password, name) => {
    setIsLoading(true);
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error("No internet connection");
      }

      // 1. Create the account in Appwrite Auth
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      if (!newAccount) throw new Error("Failed to create account");

      // 2. Create a session
      await account.createEmailSession(email, password);

      // 3. Create user document in the database
      const avatarUrl = avatars.getInitialsURL(name);

      const userDocument = {
        accountId: newAccount.$id,
        name,
        email,
        avatar: avatarUrl,
      };

      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        userDocument
      );

      if (!newUser) {
        // Clean up the account if document creation fails
        await account.deleteSessions();
        throw new Error("Failed to create user document");
      }

      // 4. Save only the essential user data locally
      const userData = {
        $id: newUser.$id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        accountId: newUser.accountId,
      };

      await saveUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
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

  const requestEmailOtp = async (email, { phrase = false, userId } = {}) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    try {
      const desiredId = userId ?? ID.unique();
      // Returns Token with userId (and optional phrase if enabled)
      const token = await account.createEmailToken(desiredId, email, phrase);
      return { userId: token.userId, phrase: token.phrase };
    } catch (error) {
      console.error("requestEmailOtp error:", error);
      // Re-throw a friendly message
      throw new Error(
        error?.message || "Failed to send OTP. Please try again."
      );
    }
  };

  const verifyEmailOtp = async ({ userId, code }) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    setIsLoading(true);
    try {
      // Create a session using the OTP code as secret (object form for RN SDK)
      await account.createSession({ userId, secret: code });

      // Get the authenticated account
      const currentAccount = await account.get();

      // Try fetching user document; if missing, create it (first sign-in)
      let userData;
      try {
        userData = await fetchUserDocument(currentAccount.$id);
      } catch (err) {
        // Create minimal profile
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
      // 1. Verify the user's password by creating a new email session
      await account.createEmailSession(user.email, password);

      // 2. Delete user document from database
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        user.$id
      );

      // 3. Delete the account
      await account.delete();

      // 4. Clear local storage and state
      await clearUser();
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === 401) {
        throw new Error("Incorrect password. Please try again.");
      }
      throw new Error("Failed to delete account. Please try again later.");
    }
  };

  const value = {
    user,
    isLoading,
    isOffline,
    login,
    register,
    logout,
    isLoggedIn,
    deleteAccount,
    requestEmailOtp,
    verifyEmailOtp,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
