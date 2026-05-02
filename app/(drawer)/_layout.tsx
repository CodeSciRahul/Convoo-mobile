import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import AuthGuard from "../../components/AuthGuard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";

export default function DrawerLayout() {
    const colorschema = useColorScheme()
    return (
        <SafeAreaView className="flex-1">
            <AuthGuard>
                <Drawer
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: colorschema === "light" ? "#ffffff" : "#1A1A1A",
                            elevation: 8,

                            // Shadow for iOS
                            shadowColor: colorschema === "light" ? "#00000020" : "#60A5FA55", // soft glow tint
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                        },
                        headerTintColor: `${colorschema === "light" ? "#111111" : "#60A5FA"}`,

                        drawerStyle: {
                            backgroundColor: colorschema === "light" ? "#f6f6f6" : "#111111",
                        },

                        drawerLabelStyle: {
                            fontSize: 15,
                            fontWeight: "600",
                        },

                        drawerActiveBackgroundColor:
                            colorschema === "light" ? "#e5e9ff" : "#1A1A1A",

                        drawerActiveTintColor:
                            colorschema === "light" ? "#2563EB" : "#60A5FA", // (blue-600 for light) (blue-400 for dark)

                        drawerInactiveTintColor:
                            colorschema === "light" ? "#4A4A4A" : "#BBBBBB",

                        drawerInactiveBackgroundColor: "transparent",
                        swipeEnabled: true,
                    }}
                >
                    <Drawer.Screen
                        name="(tab)"
                        options={{
                            title: 'My Chats',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="chatbox-outline" color={color} size={size} />
                            ),
                            drawerLabel: 'Chats',
                        }} />
                    <Drawer.Screen
                        name="profile"
                        options={{
                            title: 'Profile',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="person" color={color} size={size} />
                            )
                        }} />
                    <Drawer.Screen
                        name="setting"
                        options={{
                            title: 'Setting',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="settings" color={color} size={size} />
                            )

                        }} />
                </Drawer>
            </AuthGuard>
        </SafeAreaView>
    )
}