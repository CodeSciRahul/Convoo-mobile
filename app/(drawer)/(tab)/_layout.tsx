import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import CustomTab from "@/components/customTab";

export default function TabLayout() {
    const colorschema = useColorScheme()
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: `${colorschema === "light" ? "#FFFFFF" : "#141414"}`,
                },
                tabBarActiveTintColor: colorschema === "light" ? "#2563EB" : "#60A5FA",
                tabBarInactiveTintColor: colorschema === "light" ? "#6B7280" : "#A1A1A1",
            }}
        >
            <Tabs.Screen
                name="contacts"
                options={{
                    title: 'Contacts',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" color={color} size={size} />
                    )
                }}
            />
            <Tabs.Screen name="groups" options={{
                title: 'Groups',
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="people-outline" color={color} size={size} />
                )
            }} />
        </Tabs>
        // <Tabs 
        // tabBar={(props) => <CustomTab {...props}/>}
        // screenOptions={{
        //     headerShown: false,
        // }}
        // ></Tabs>
    )
}