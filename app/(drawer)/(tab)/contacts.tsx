import ChatListRow, { formatChatTime } from '@/components/ChatListRow';
import { BottomSheetComponent, BottomSheetRef } from '@/components/ui/bottom-sheet';
import { useSelection } from '@/zustand/selection.store';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { addUser, getReceivers } from '../../../services/apiServices';
import { Receiver, ReceiversResponse } from '../../../types';
import { useReceiver } from '../../../zustand/receiver.store';

const BG = '#07090F';

function Fab({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} className="absolute right-5 bottom-28">
            <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#6366f1',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 12,
                    elevation: 10,
                }}
            >
                <Ionicons name="person-add" size={24} color="#fff" />
            </LinearGradient>
        </TouchableOpacity>
    );
}

function ListHeader({ count }: { count: number }) {
    return (
        <View className="px-6 pt-2 pb-5">
            <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-2">
                Messages
            </Text>
            <Text className="text-white text-[28px] font-bold tracking-tight leading-tight">
                Your chats
            </Text>
            <Text className="text-slate-500 text-sm mt-1.5">
                {count === 0
                    ? 'Start a conversation with someone new'
                    : `${count} conversation${count === 1 ? '' : 's'}`}
            </Text>
        </View>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <View className="items-center justify-center px-10 py-16">
            <View className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mb-5">
                <Ionicons name="chatbubbles-outline" size={40} color="#818cf8" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">No chats yet</Text>
            <Text className="text-slate-500 text-center text-sm leading-relaxed mb-6">
                Add a contact by email or phone to start messaging
            </Text>
            <TouchableOpacity onPress={onAdd} activeOpacity={0.85} className="rounded-2xl overflow-hidden">
                <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        gap: 8,
                    }}
                >
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text className="text-white font-bold text-[15px]">Add contact</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

export default function ChatsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [contact, setContact] = useState('');
    const { selectedContacts, setSelectedContacts } = useSelection();
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const { setReceiver } = useReceiver();
    const [fieldFocused, setFieldFocused] = useState(false);
    const lineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(lineAnim, {
            toValue: fieldFocused ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [fieldFocused]);

    const lineWidth = lineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const { data: receivers, isLoading, refetch } = useQuery<ReceiversResponse>({
        queryKey: ['receivers'],
        queryFn: async () => {
            const response = await getReceivers();
            return response.data as ReceiversResponse;
        },
    });

    const list = receivers?.receivers || [];

    const { mutate: addUserMutation, isPending: isAddingUser } = useMutation({
        mutationFn: async (payload: { email?: string; mobile?: string }) => {
            const response = await addUser(payload);
            return response.data;
        },
        onSuccess: () => {
            Toast.show({ text1: 'Contact added successfully', type: 'success' });
            refetch();
            bottomSheetRef.current?.dismiss();
            setContact('');
        },
        onError: (error: unknown) => {
            if (error instanceof AxiosError) {
                Toast.show({ text1: `${error.response?.data?.message}`, type: 'error' });
            } else {
                Toast.show({ text1: 'An unexpected error occurred', type: 'error' });
            }
        },
    });

    const openAddSheet = () => {
        requestAnimationFrame(() => bottomSheetRef.current?.present());
    };

    const handleLongPress = (item: Receiver) => {
        Haptics.selectionAsync();
        setSelectedContacts(
            selectedContacts.includes(item)
                ? selectedContacts.filter((c) => c._id !== item._id)
                : [...selectedContacts, item]
        );
    };

    const handlePress = (item: Receiver) => {
        if (selectedContacts.length > 0) {
            Haptics.selectionAsync();
            setSelectedContacts(
                selectedContacts.includes(item)
                    ? selectedContacts.filter((c) => c._id !== item._id)
                    : [...selectedContacts, item]
            );
        } else {
            setReceiver({ receiver: item, selectionType: 'private' });
            router.push(`/chat/${item._id}`);
        }
    };

    const handleAddContact = () => {
        const trimmed = contact.trim();
        if (!trimmed) return;
        const isEmail = trimmed.includes('@');
        addUserMutation(isEmail ? { email: trimmed } : { mobile: trimmed });
    };

    return (
        <View className="flex-1" style={{ backgroundColor: BG }}>
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-slate-500 text-sm mt-4">Loading conversations…</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={list}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <ChatListRow
                                name={item.name}
                                subtitle={item.lastMessage?.content}
                                timestamp={formatChatTime(item.lastMessageTimestamp)}
                                avatarUri={item.profilePic}
                                unreadCount={item.unreadCount}
                                selected={selectedContacts.includes(item)}
                                onPress={() => handlePress(item)}
                                onLongPress={() => handleLongPress(item)}
                            />
                        )}
                        ListHeaderComponent={<ListHeader count={list.length} />}
                        ListEmptyComponent={<EmptyState onAdd={openAddSheet} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingBottom: 120,
                            flexGrow: list.length === 0 ? 1 : undefined,
                        }}
                    />
                    {list.length > 0 && <Fab onPress={openAddSheet} />}
                </>
            )}

            <BottomSheetComponent 
            snapPoints={['55%']} 
            initialSnapIndex={0} 
            ref={bottomSheetRef}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="px-6 pb-8 bg-[#111827]">
                        <View className="items-center mb-6">
                            <View className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 items-center justify-center mb-4">
                                <Ionicons name="person-add" size={28} color="#818cf8" />
                            </View>
                            <Text className="text-white text-xl font-bold">Add contact</Text>
                            <Text className="text-slate-500 text-sm text-center mt-2 px-4 leading-relaxed">
                                Enter an email or phone number to find someone on Convoo
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text
                                className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${
                                    fieldFocused ? 'text-indigo-400' : 'text-slate-500'
                                }`}
                            >
                                Email or phone
                            </Text>
                            <View className="flex-row items-center pb-3 gap-3">
                                <Ionicons
                                    name="at-outline"
                                    size={16}
                                    color={fieldFocused ? '#818cf8' : '#334155'}
                                />
                                <TextInput
                                    className="flex-1 text-[15px] text-slate-100 p-0 m-0"
                                    placeholder="contact@example.com"
                                    placeholderTextColor="#1e293b"
                                    value={contact}
                                    onChangeText={setContact}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setFieldFocused(true)}
                                    onBlur={() => setFieldFocused(false)}
                                />
                            </View>
                            <View className="h-px bg-white/[0.07]" />
                            <Animated.View
                                style={{ width: lineWidth }}
                                className="h-px bg-indigo-500 absolute bottom-0 left-0"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleAddContact}
                            disabled={isAddingUser || !contact.trim()}
                            activeOpacity={0.85}
                            className="rounded-2xl overflow-hidden"
                        >
                            <LinearGradient
                                colors={
                                    isAddingUser || !contact.trim()
                                        ? ['#1e293b', '#1e293b']
                                        : ['#6366f1', '#4f46e5']
                                }
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 17,
                                    gap: 8,
                                }}
                            >
                                {isAddingUser ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-[15px]">
                                            Add contact
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </BottomSheetComponent>
        </View>
    );
}
