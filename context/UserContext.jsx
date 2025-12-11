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
  // Effect to load user from local storage and validate with Appwrite
  useEffect(() => {
    const loadAndValidateUser = async () => {
      // 1. Try to load user from local storage first (for instant UX)
      const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setIsLoading(false);
      }

      try {
        // 2. Regardless of local cache, attempt to validate the session with Appwrite in the background.
        const currentAccount = await account.get();

        if (currentAccount) {
          // If a session exists, fetch the user's document
          const userData = await fetchUserDocument(currentAccount.$id);
          saveUser(userData);
        } else {
          // If no active session, clear the local cache
          clearUser();
        }
      } catch (error) {
        // Session validation failed (e.g., token expired, network error)
        if (
          error &&
          error.code !== 0 &&
          error.code !== "ECONNREFUSED" &&
          error.code !== "ENETUNREACH"
        ) {
          setUser(null);
          await clearUser();
          console.log("Session expired or user deleted. Please log in again.");
        } else {
          console.log("Session validation error:", error);
        }
        // Don't clear user on network errors to allow offline usage
      } finally {
        // Ensure isLoading is set to false after the full validation process
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
      setUser(null);
    } catch (error) {
      throw new Error();
    }
  };

  // Register new user
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
      await account.createEmailPasswordSession(email, password);

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

  // Login user
  const login = async (email, password) => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error("No internet connection");
    }
    setIsLoading(true);
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const userData = await fetchUserDocument(session.userId);
      saveUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      clearUser();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await clearUser();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    return user !== null;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isOffline,
        register,
        login,
        logout,
        isLoggedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
