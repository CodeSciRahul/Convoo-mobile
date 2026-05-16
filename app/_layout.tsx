import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const colorschema = useColorScheme()
  const safeAreaInset = useSafeAreaInsets()

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1">

        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar
              backgroundColor={"#4f46e5"}
              style={"light"}
            />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colorschema === "light" ? "#ffffff" : "#1A1A1A",
                },
                headerLargeTitleStyle: {
                  color: colorschema === "light" ? "#111111" : "#FFFFFF",
                },
                headerTintColor: `${colorschema === "light" ? "#111111" : "#60A5FA"}`,
                statusBarStyle: `${colorschema === "light" ? "dark" : "light"}`,
                statusBarBackgroundColor: `${colorschema === "light" ? "#60A5FA" : "#121212"}`
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen
                name="(drawer)"
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
              <Stack.Screen
                name="group"
                options={{
                  headerShown: true,
                  title: 'Create Group',
                  presentation: 'modal',
                  headerStyle: {
                    backgroundColor: '#07090F',
                  },
                  headerTintColor: '#a5b4fc',
                  headerTitleStyle: { color: '#f8fafc', fontWeight: '700' },
                }}
              />
              <Stack.Screen
                name="group/[id]"
                options={{
                  headerShown: true,
                  title: 'Edit Group',
                  headerStyle: { backgroundColor: '#07090F' },
                  headerTintColor: '#a5b4fc',
                  headerTitleStyle: { color: '#f8fafc', fontWeight: '700' },
                }}
              />
            </Stack>
          </BottomSheetModalProvider>
          <PortalHost />
          <Toast 
          position='top'
          topOffset={
            safeAreaInset.top + 10
          }
          />
        </SafeAreaProvider>

      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
