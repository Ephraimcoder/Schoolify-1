import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import Category from './Category'
import Priority from './Priority'
import ReminderPref from './ReminderPref'
import Task from './Task'
import User from './User'

class NotificationPref extends Model {
  static table = 'notification_prefs'
  @field('lead_minutes') leadMinutes
}

export const models = [
  User, 
  Task, 
  Category, 
  Priority, 
  NotificationPref,
  ReminderPref
]