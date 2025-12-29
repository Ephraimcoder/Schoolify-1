import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "./migrations";
import BackupPref from "./models/BackupPref";
import Category from "./models/Category";
import NotificationPref from "./models/NotificationPref";
import Priority from "./models/Priority";
import ReminderPref from "./models/ReminderPref";
import Task from "./models/Task";
import schema from "./schema";

// 1. Setup the Adapter (The bridge to the SQLite file)
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // jsi: true, // Use JSI for better performance (requires extra setup in some RN versions)
  onSetUpError: (error) => {
    console.error("Database failed to load", error);
  },
});

// 2. Initialize the Database
export const database = new Database({
  adapter,
  modelClasses: [
    BackupPref,
    Task,
    Category,
    Priority,
    ReminderPref,
    NotificationPref,
  ],
});
