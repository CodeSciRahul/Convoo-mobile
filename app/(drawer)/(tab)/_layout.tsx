// import { Ionicons } from "@expo/vector-icons";
// import { Tabs } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useColorScheme } from "react-native";
// import CustomTab from "@/components/customTab";

// export default function TabLayout() {
//     const colorschema = useColorScheme()
//     return (
//         <Tabs
//             screenOptions={{
//                 headerShown: false,
//                 tabBarStyle: {
//                     backgroundColor: `${colorschema === "light" ? "#FFFFFF" : "#141414"}`,
//                 },
//                 tabBarActiveTintColor: colorschema === "light" ? "#2563EB" : "#60A5FA",
//                 tabBarInactiveTintColor: colorschema === "light" ? "#6B7280" : "#A1A1A1",
//             }}
//         >
//             <Tabs.Screen
//                 name="contacts"
//                 options={{
//                     title: 'Contacts',
//                     tabBarIcon: ({ color, size }) => (
//                         <Ionicons name="person-outline" color={color} size={size} />
//                     )
//                 }}
//             />
//             <Tabs.Screen name="groups" options={{
//                 title: 'Groups',
//                 tabBarIcon: ({ color, size }) => (
//                     <Ionicons name="people-outline" color={color} size={size} />
//                 )
//             }} />
//         </Tabs>
//         // <Tabs 
//         // tabBar={(props) => <CustomTab {...props}/>}
//         // screenOptions={{
//         //     headerShown: false,
//         // }}
//         // ></Tabs>
//     )
// }
import { ActionBar } from "@/components/ActionBar";
import CustomTab from "@/components/customTab";
import { deleteMultipleParticipents } from "@/services/apiServices";
import { useSelection } from "@/zustand/selection.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";

export default function TabLayout() {
  const { selectedContacts, clearSelection } = useSelection();
  const isSelecting = selectedContacts.length > 0;
  const queryClient = useQueryClient();
  const {mutate: deleteMultipleParticipentsMutation} = useMutation({
    mutationFn: deleteMultipleParticipents,
        onSuccess: (data) => {
            Toast.show({
                type: "success",
                text1: "Conversations deleted successfully"
            });
            queryClient.invalidateQueries({ queryKey: ["receivers"] });
        },
        onError: (error) => {
            Toast.show({
                type: "error",
                text1: "Failed to delete conversations"
            });
        },
        onSettled: () => {
            clearSelection();
        },
  });

    const handleDelete = () => {
        deleteMultipleParticipentsMutation(
            selectedContacts.map((contact) => contact.conversationId)
        );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {display: "none"},
      }}
      // Render custom action bar when selecting
      tabBar={(props) =>
        isSelecting ? (
          <ActionBar
            count={selectedContacts.length}
            onDelete={handleDelete}
            onCancel={clearSelection}
          />
        ) : (
            <View className="absolute bottom-0 left-0 right-0">
                <CustomTab {...props} />
            </View>
        )
      }
    />
  );
}