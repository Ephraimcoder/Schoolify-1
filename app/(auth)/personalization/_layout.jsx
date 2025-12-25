import { Stack } from "expo-router";

export default function PersonalizationLayout() {
  return (
    <Stack>
      <Stack.Screen name="backup-settings" options={{ headerShown: false }} />
      <Stack.Screen
        name="notification-timing"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="daily-reminder" options={{ headerShown: false }} />
    </Stack>
  );
}
