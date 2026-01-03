import { Model } from "@nozbe/watermelondb";
import {
  date,
  field,
  readonly,
  relation,
  text,
} from "@nozbe/watermelondb/decorators";

export default class Task extends Model {
  static table = "tasks";
  static associations = {
    categories: { type: "belongs_to", key: "category_id" },
    priorities: { type: "belongs_to", key: "priority_id" },
  };

  // Core
  @text("title") title;
  @text("description") description;
  @field("is_completed") isCompleted;
  @text("item_type") itemType; // 'task' | 'class'

  // Denormalized labels (for current UI)
  @text("category_name") categoryName;
  @text("priority_name") priorityName;

  // Optional relations
  @relation("categories", "category_id") category;
  @relation("priorities", "priority_id") priority;

  // User association
  @text("user_id") userId;

  // Schedule & notifications
  @date("due_date") dueDate; // timestamp (ms)
  @date("due_time") dueTime; // timestamp (ms)
  @field("alert_enabled") alertEnabled;
  @text("notification_id") notificationId;

  // Subtasks as JSON string
  @text("subtasks_json") subtasksJson;

  // Class-specific fields
  @text("instructor") instructor;
  @text("location") location;
  @text("code") code;
  @text("color") color;

  // Timestamps
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
  @date("last_synced_at") lastSyncedAt;
  @text("appwrite_id") appwriteId;
}
