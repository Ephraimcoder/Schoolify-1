import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="otp-start"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="otp-verify"
        options={{
          presentation: "card",
        }}
      />
    </Stack>
  );
}
