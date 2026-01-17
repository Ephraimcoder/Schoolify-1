import { Model } from "@nozbe/watermelondb";
import { children, field, text } from "@nozbe/watermelondb/decorators";

export default class Priority extends Model {
  static table = "priorities";
  static associations = {
    tasks: { type: "has_many", foreignKey: "priority_id" },
  };

  @text("name") name; // e.g., "High"
  @field("level") level; // e.g., 3 (highest)
  @text("color") color;
  @text("user_id") userId;

  @children("tasks") tasks;
}
