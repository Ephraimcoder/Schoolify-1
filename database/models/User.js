import { Model } from '@nozbe/watermelondb'
import { date, text } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  static table = 'users'

  @text('appwrite_id') appwriteId
  @text('email') email
  @text('name') name
  @text('avatar') avatar
  @text('session_id') sessionId
  @date('last_login_at') lastLoginAt
}