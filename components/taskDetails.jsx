// import { Ionicons } from "@expo/vector-icons";
// import { FlatList, ScrollView, Text, View } from "react-native";
// import {
//   formatDate,
//   formatTime,
//   getCategoryStyle,
//   getPriorityClasses,
// } from "../utils/taskUtils";

// const TaskDetails = ({ task }) => {
//   if (!task) return null;

//   const renderSubtask = ({ item, index }) => (
//     <View
//       key={`subtask-${index}`}
//       className="flex-row items-center py-2 border-b border-gray-100"
//     >
//       <View className="w-5 h-5 rounded-full border border-gray-300 mr-3" />
//       <Text className="text-gray-700 font-quicksandMedium flex-1">
//         {item.title}
//       </Text>
//     </View>
//   );

//   const renderEmptySubtasks = () => (
//     <View className="py-4 items-center justify-center">
//       <Ionicons name="list-outline" size={32} color="#9CA3AF" />
//       <Text className="text-gray-500 font-quicksandMedium mt-2">
//         No subtasks added yet
//       </Text>
//     </View>
//   );

//   return (
//     <ScrollView className="flex-1 bg-gray-50">
//       <View className="p-5">
//         {/* Header Section */}
//         <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
//           <View className="flex-row justify-between items-start mb-4">
//             {task.category && (
//               <View className="self-start mb-4">
//                 <Text
//                   className="text-xs font-quicksandSemiBold px-3 py-1.5 rounded-full"
//                   style={getCategoryStyle(task.color)}
//                 >
//                   {task.category}
//                 </Text>
//               </View>
//             )}
//             {task.priority && (
//               <View
//                 className={`px-3 py-1.5 rounded-full border ${getPriorityClasses(task.priority)}`}
//               >
//                 <Text className="text-xs font-quicksandBold uppercase tracking-wider">
//                   {task.priority}
//                 </Text>
//               </View>
//             )}
//           </View>
//           <Text className="text-2xl font-quicksandBold text-gray-900 flex-1 mr-2">
//             {task.title}
//           </Text>
//           {/* Description */}
//           {task.description && (
//             <View className="mt-4 pt-4 border-t border-gray-100">
//               <Text className="text-gray-600 font-quicksandSemiBold mb-2">
//                 Description
//               </Text>
//               <Text className="text-gray-700 text-base font-quicksandMedium leading-6">
//                 {task.description}
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Subtasks Section */}
//         <View className="bg-white rounded-2xl p-5 shadow-sm">
//           <View className="flex-row justify-between items-center mb-4">
//             <Text className="text-lg font-quicksandBold text-gray-900">
//               Subtasks
//             </Text>
//           </View>

//           <FlatList
//             data={task.subTasks || []}
//             renderItem={renderSubtask}
//             keyExtractor={(item, index) => `subtask-${index}`}
//             ListEmptyComponent={renderEmptySubtasks}
//             scrollEnabled={false}
//           />
//         </View>

//         {/* Due Date & Time Section */}
//         <View className="bg-white rounded-2xl p-5 shadow-sm mt-6">
//           <Text className="text-lg font-quicksandBold text-gray-900 mb-4">
//             Due Date & Time
//           </Text>

//           <View className="flex-row items-center mb-3">
//             <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
//               <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
//             </View>
//             <View>
//               <Text className="text-gray-600 font-quicksandSemiBold text-sm">
//                 Due Date
//               </Text>
//               <Text className="text-gray-900 font-quicksandMedium">
//                 {formatDate(task.dueDate)}
//               </Text>
//             </View>
//           </View>

//           <View className="flex-row items-center">
//             <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
//               <Ionicons name="time-outline" size={20} color="#8B5CF6" />
//             </View>
//             <View>
//               <Text className="text-gray-600 font-quicksandSemiBold text-sm">
//                 Time
//               </Text>
//               <Text className="text-gray-900 font-quicksandMedium">
//                 {formatTime(task.dueTime)}
//               </Text>
//             </View>
//           </View>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// export default TaskDetails;
