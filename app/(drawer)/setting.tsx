import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../hooks/useAuth";
import { ScrollView } from "react-native";
import { useColorScheme } from "react-native";

export default function SettingScreen() {
    const { mutate: logout, isPending } = useLogout();
    const colorschema = useColorScheme()

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            {
                text: "Cancel",
                style: "cancel"
            },
            {
                text: "Logout",
                onPress: () => logout(),
                style: "destructive"
            }
        ]);
    };

    return (
        <ScrollView
            style={{
                backgroundColor: "#181818"
            }}
        >
            <View className="flex-1 p-4">
                <TouchableOpacity
                    className="bg-red-500 p-4 rounded-md"
                    onPress={handleLogout}
                    disabled={isPending}
                >
                    <Text className="text-white text-center font-semibold">
                        {isPending ? "Logging out..." : "Logout"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>

    )
}