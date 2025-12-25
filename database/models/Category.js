import { Model } from '@nozbe/watermelondb'
import { children, text } from '@nozbe/watermelondb/decorators'

export default class Category extends Model {
  static table = 'categories'
  static associations = {
    tasks: { type: 'has_many', foreignKey: 'category_id' },
  }

  @text('name') name

  @children('tasks') tasks
}