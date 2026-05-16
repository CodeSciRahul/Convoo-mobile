import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { getGroups } from '../../../services/apiServices';
import { Group, Groups } from '../../../types';
import { useReceiver } from '../../../zustand/receiver.store';
export default function GroupsScreen() {
  const { data: groups, isLoading } = useQuery<Groups>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await getGroups();
      return response.data;
    },
  });
  const { setReceiver } = useReceiver();
  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700"
      onPress={() => {
        setReceiver({ receiver: item, selectionType: "group" })
        router.push(`/chat/${item?._id}`);
      }}>
      <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-3">
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} className="w-12 h-12 rounded-full" />
        ) : (
          <Ionicons name="people" size={24} color="white" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.name}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{item?.lastMessageTimestamp ? new Date(item?.lastMessageTimestamp).toLocaleString() : ''}</Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <Text className="text-gray-600 dark:text-gray-300 flex-1" numberOfLines={1}>
              {item.lastMessage}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 ml-2">
              {item?.members?.length} members
            </Text>
          </View>
          {item?.unreadCount && item?.unreadCount > 0 && (
            <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center ml-2">
              <Text className="text-white text-xs font-semibold">
                {item?.unreadCount || 0}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    isLoading ? (
      <View className='flex-1 bg-white dark:bg-[#181818]'>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : (
      <View className="flex-1 bg-white dark:bg-[#181818]">
        <FlatList
          data={groups?.groups || []}
          keyExtractor={(item) => item?._id || ''}
          renderItem={renderGroupItem}
          showsVerticalScrollIndicator={false}
        />
        <TouchableOpacity onPress={() => router.push('/group')} className='absolute bottom-28 right-10 p-4 bg-gray-200 dark:bg-gray-800 rounded-xl '>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    )
  );
}
