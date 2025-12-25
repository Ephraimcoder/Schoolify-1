import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class NotificationPref extends Model {
  static table = 'notification_prefs';
  
  @field('lead_minutes') leadMinutes;
}
