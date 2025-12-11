import { Toaster as BackpackToaster } from "@backpackapp-io/react-native-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Toaster() {
  const insets = useSafeAreaInsets();

  return (
    <BackpackToaster
      position="bottom"
      containerStyle={{
        bottom: insets.bottom + 20,
        left: 20,
        right: 20,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "bg-white rounded-lg p-4 border border-gray-200 shadow-md",
          title: "font-quicksandBold text-gray-900",
          description: "font-quicksand text-gray-600",
          error: "bg-red-50 border-red-200",
          success: "bg-green-50 border-green-200",
        },
      }}
    />
  );
}
