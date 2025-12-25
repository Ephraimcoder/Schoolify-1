import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ReminderPref extends Model {
  static table = 'reminder_prefs';

  @field('hour') hour;
  @field('minute') minute;
  @field('enabled') enabled;

  // Helper method to get the next scheduled time
  getNextScheduledTime() {
    if (!this.enabled) return null;
    
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(this.hour, this.minute, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled;
  }
}
