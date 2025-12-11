// // components/ProtectedRoute.jsx
// import { useRouter } from "expo-router";
// import { useEffect } from "react";
// import { ActivityIndicator, View } from "react-native";
// import useAuthStore from "../store/auth.store";

// export default function ProtectedRoute({ children }) {
//   const { isAuthenticated, isLoading } = useAuthStore();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//       router.replace("/(auth)");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   if (!isAuthenticated) {
//     return null; // or a loading indicator
//   }

//   return children;
// }
