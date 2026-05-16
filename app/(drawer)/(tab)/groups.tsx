import ChatListRow, { formatChatTime } from '@/components/ChatListRow';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getGroups } from '../../../services/apiServices';
import { Group, Groups } from '../../../types';
import { useReceiver } from '../../../zustand/receiver.store';

const BG = '#07090F';

function Fab({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} className="absolute right-5 bottom-28">
            <LinearGradient
                colors={['#7c3aed', '#4f46e5']}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#7c3aed',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 12,
                    elevation: 10,
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
        </TouchableOpacity>
    );
}

function ListHeader({ count }: { count: number }) {
    return (
        <View className="px-6 pt-2 pb-5">
            <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-2">
                Communities
            </Text>
            <Text className="text-white text-[28px] font-bold tracking-tight leading-tight">
                Your groups
            </Text>
            <Text className="text-slate-500 text-sm mt-1.5">
                {count === 0
                    ? 'Create a group and chat with multiple people'
                    : `${count} group${count === 1 ? '' : 's'}`}
            </Text>
        </View>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <View className="items-center justify-center px-10 py-16">
            <View className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 items-center justify-center mb-5">
                <Ionicons name="people-outline" size={40} color="#a78bfa" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">No groups yet</Text>
            <Text className="text-slate-500 text-center text-sm leading-relaxed mb-6">
                Bring your team or friends together in one place
            </Text>
            <TouchableOpacity onPress={onCreate} activeOpacity={0.85} className="rounded-2xl overflow-hidden">
                <LinearGradient
                    colors={['#7c3aed', '#4f46e5']}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        gap: 8,
                    }}
                >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text className="text-white font-bold text-[15px]">Create group</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

export default function GroupsScreen() {
    const { data: groups, isLoading } = useQuery<Groups>({
        queryKey: ['groups'],
        queryFn: async () => {
            const response = await getGroups();
            return response.data;
        },
    });
    const { setReceiver } = useReceiver();

    const list = groups?.groups || [];

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="text-slate-500 text-sm mt-4">Loading groups…</Text>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: BG }}>
            <FlatList
                data={list}
                keyExtractor={(item) => item._id}
                renderItem={({ item }: { item: Group }) => (
                    <ChatListRow
                        name={item.name}
                        subtitle={
                            typeof item.lastMessage === 'string'
                                ? item.lastMessage
                                : undefined
                        }
                        timestamp={formatChatTime(item.lastMessageTimestamp)}
                        avatarUri={item.profilePic}
                        unreadCount={item.unreadCount}
                        isGroup
                        meta={`${item.members?.length ?? 0} members`}
                        onPress={() => {
                            setReceiver({ receiver: item, selectionType: 'group' });
                            router.push(`/chat/${item._id}`);
                        }}
                    />
                )}
                ListHeaderComponent={<ListHeader count={list.length} />}
                ListEmptyComponent={<EmptyState onCreate={() => router.push('/group')} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 120,
                    flexGrow: list.length === 0 ? 1 : undefined,
                }}
            />
            {list.length > 0 && <Fab onPress={() => router.push('/group')} />}
        </View>
    );
}
