import { Q } from "@nozbe/watermelondb";
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

  const saveUser = async (userData) => {
    try {
      setUser(userData);

      // Upsert into WatermelonDB
      const users = database.collections.get("users");
      const existingUsers = await users
        .query(Q.where("appwrite_id", userData.accountId))
        .fetch();

      await database.write(async () => {
        if (existingUsers.length > 0) {
          // Update existing user
          await existingUsers[0].update((user) => {
            user.name = userData.name;
            user.email = userData.email;
            user.avatar = userData.avatar || "";
            user.session_id = userData.sessionId || "";
            user.last_login_at = Date.now();
          });
        } else {
          // Create new user
          await users.create((newUser) => {
            newUser.appwrite_id = userData.accountId;
            newUser.name = userData.name;
            newUser.email = userData.email;
            newUser.avatar = userData.avatar || "";
            newUser.session_id = userData.sessionId || "";
            newUser.last_login_at = Date.now();
          });
        }
      });
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadAndValidateUser = async () => {
      try {
        // Try to load user from WatermelonDB
        const users = database.collections.get("users");
        const userList = await users.query().fetch();

        if (userList.length > 0) {
          const localUser = userList[0];
          setUser({
            $id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            avatar: localUser.avatar,
            accountId: localUser.appwrite_id,
            sessionId: localUser.session_id,
          });
        }

        // Check for pending logout
        const pendingLogout = userList.some((u) => u.pending_logout);
        if (pendingLogout) {
          try {
            await account.deleteSessions();
            await database.write(async () => {
              await userList[0].update((user) => {
                user.pending_logout = false;
              });
            });
          } catch (e) {
            console.log("Pending logout: could not revoke session yet", e);
          }
          setUser(null);
          return;
        }

        // If a logout is pending (e.g. user logged out while offline), don't auto-login.
        const logoutPending = pendingLogout;

        try {
          // If logout is pending, try to revoke the server session and keep user signed out.
          if (logoutPending) {
            try {
              await account.deleteSessions();
              await database.write(async () => {
                await userList[0].update((user) => {
                  user.pending_logout = false;
                });
              });
            } catch (e) {
              console.log("Pending logout: could not revoke session yet", e);
            }
            // Ensure local user is cleared; avoid auto-login this cycle
            await database.write(async () => {
              await userList[0].destroyPermanently();
            });
            setUser(null);
            return;
          }

          // Otherwise, attempt to validate the session with Appwrite in the background.
          const currentAccount = await account.get();

          if (currentAccount) {
            // If a session exists, fetch the user's document
            const userData = await fetchUserDocument(currentAccount.$id);
            saveUser(userData);
          } else {
            // If no active session, clear the local cache
            await database.write(async () => {
              await userList[0].destroyPermanently();
            });
            setUser(null);
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
            await database.write(async () => {
              await userList[0].destroyPermanently();
            });
            console.log(
              "Session expired or user deleted. Please log in again."
            );
          } else {
            console.log("Session validation error:", error);
          }
          // Don't clear user on network errors to allow offline usage
        } finally {
          // Ensure isLoading is set to false after the full validation process
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndValidateUser();
  }, []);

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
      await database.write(async () => {
        const users = database.collections.get("users");
        const userList = await users.query().fetch();
        if (userList.length > 0) {
          await userList[0].destroyPermanently();
        }
      });
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
      // Mark logout as pending in WatermelonDB
      const users = database.collections.get("users");
      const userList = await users.query().fetch();

      if (userList.length > 0) {
        await database.write(async () => {
          await userList[0].update((user) => {
            user.pending_logout = true;
          });
        });
      }

      // Clear local state
      setUser(null);

      // Try to revoke session
      try {
        await account.deleteSessions();

        // Clear the pending flag if logout was successful
        if (userList.length > 0) {
          await database.write(async () => {
            await userList[0].update((user) => {
              user.pending_logout = false;
              user.session_id = "";
            });
          });
        }
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
      await database.write(async () => {
        const users = database.collections.get("users");
        const userList = await users.query().fetch();
        if (userList.length > 0) {
          await userList[0].destroyPermanently();
        }
      });
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
