import { appSchema, tableSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "backup_prefs",
      columns: [{ name: "enabled", type: "boolean" }],
    }),
    tableSchema({
      name: "categories",
      columns: [{ name: "name", type: "string" }],
    }),
    tableSchema({
      name: "priorities",
      columns: [
        { name: "name", type: "string" },
        { name: "level", type: "number" },
        { name: "color", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: "notification_prefs",
      columns: [{ name: "lead_minutes", type: "number" }],
    }),
    tableSchema({
      name: "reminder_prefs",
      columns: [
        { name: "hour", type: "number" },
        { name: "minute", type: "number" },
        { name: "enabled", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "tasks",
      columns: [
        // Core fields
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "is_completed", type: "boolean" },
        { name: "item_type", type: "string", isIndexed: true }, // 'task' or 'class'

        // Denormalized fields for better performance
        { name: "category_name", type: "string", isOptional: true },
        { name: "priority_name", type: "string", isOptional: true },

        // Relations
        {
          name: "category_id",
          type: "string",
          isIndexed: true,
          isOptional: true,
        },
        {
          name: "priority_id",
          type: "string",
          isIndexed: true,
          isOptional: true,
        },
        { name: "user_id", type: "string", isIndexed: true },

        // Schedule & notifications
        { name: "due_date", type: "number", isOptional: true },
        { name: "due_time", type: "number", isOptional: true },
        { name: "alert_enabled", type: "boolean", isOptional: true },
        { name: "notification_id", type: "string", isOptional: true },

        // Subtasks
        { name: "subtasks_json", type: "string", isOptional: true },

        // Class-specific fields
        { name: "instructor", type: "string", isOptional: true },
        { name: "location", type: "string", isOptional: true },
        { name: "code", type: "string", isOptional: true },
        { name: "color", type: "string", isOptional: true },
        { name: "schedule", type: "string", isOptional: true }, // JSON string for class schedule

        // Timestamps
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "last_synced_at", type: "number", isOptional: true },
        { name: "appwrite_id", type: "string", isOptional: true },
      ],
    }),
  ],
});
