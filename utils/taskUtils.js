// Utility functions for task-related operations

export const getPriorityClasses = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 border-red-200 text-red-700";
    case "medium":
      return "bg-amber-100 border-amber-200 text-amber-700";
    case "low":
      return "bg-emerald-100 border-emerald-200 text-emerald-700";
    default:
      return "bg-gray-100 border-gray-200 text-gray-700";
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });};

export const formatTime = (timeString) => {
  if (!timeString) return "No time";
  return new Date(timeString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCategoryStyle = (color) => ({
  backgroundColor: `${color || "#8B5CF6"}20`,
  color: color || "#8B5CF6",
});
