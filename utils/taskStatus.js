import { Ionicons } from '@expo/vector-icons';

/**
 * Calculate task status based on subtask completion
 * @param {Object} task - Task object with subtasks array
 * @returns {string} - 'todo', 'in_progress', or 'completed'
 */
export const calculateTaskStatus = (task) => {
  // No subtasks case
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.completed ? 'completed' : 'todo';
  }
  
  // Has subtasks case
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = task.subtasks.length;
  
  if (completedSubtasks === 0) return 'todo';
  if (completedSubtasks === totalSubtasks) return 'completed';
  return 'in_progress';
};

/**
 * Get status color for UI
 * @param {string} status - Task status
 * @returns {string} - Color hex code
 */
export const getStatusColor = (status) => {
  switch(status) {
    case 'todo': return '#6B7280'; // Gray
    case 'in_progress': return '#3B82F6'; // Blue  
    case 'completed': return '#10B981'; // Green
    default: return '#6B7280';
  }
};

/**
 * Get status icon name
 * @param {string} status - Task status
 * @returns {string} - Ionicons icon name
 */
export const getStatusIcon = (status) => {
  switch(status) {
    case 'todo': return 'radio-button-off';
    case 'in_progress': return 'radio-button-on';
    case 'completed': return 'checkmark-circle';
    default: return 'radio-button-off';
  }
};

/**
 * Get status label for display
 * @param {string} status - Task status
 * @returns {string} - Human readable label
 */
export const getStatusLabel = (status) => {
  switch(status) {
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return 'To Do';
  }
};

/**
 * Calculate progress percentage for tasks with subtasks
 * @param {Object} task - Task object with subtasks array
 * @returns {number} - Progress percentage (0-100)
 */
export const getProgressPercentage = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.completed ? 100 : 0;
  }
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = task.subtasks.length;
  
  return Math.round((completedSubtasks / totalSubtasks) * 100);
};
