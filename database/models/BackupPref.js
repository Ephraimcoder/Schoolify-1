import { Model } from "@nozbe/watermelondb";
import { field } from "@nozbe/watermelondb/decorators";

export default class BackupPref extends Model {
  static table = "backup_prefs";

  @field("enabled") enabled;
}
