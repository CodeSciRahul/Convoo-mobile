import GroupInfo from '@/components/GroupInfo';
import Message from '@/components/Message';
import { BottomSheetComponent, BottomSheetRef } from '@/components/ui/bottom-sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatLabelType, formatMessageType } from '@/types';
import { transformMessages } from '@/util/formatMessage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AuthGuard from '../../components/AuthGuard';
import { useUserInfo } from '../../hooks/useAuth';
import { deleteGroup, getChats, leaveGroup } from '../../services/apiServices';
import { cleanupSocketListeners, setupSocketListeners, socketHandlers } from '../../services/socketService';
import { Group, ServerMessage } from '../../types';
import { useReceiver } from '../../zustand/receiver.store';

const HEADER_HEIGHT = 64;
const BG = '#07090F';

function Avatar({
    uri,
    name,
    size = 44,
    isGroup,
}: {
    uri?: string;
    name?: string;
    size?: number;
    isGroup?: boolean;
}) {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    return (
        <View style={{ width: size, height: size }}>
            <LinearGradient
                colors={isGroup ? ['#7c3aed', '#4f46e5'] : ['#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    padding: 2,
                }}
            >
                <View
                    className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center"
                    style={{ borderRadius: (size - 4) / 2 }}
                >
                    {uri ? (
                        <Image
                            source={{ uri }}
                            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
                        />
                    ) : (
                        <Text className="text-white font-bold" style={{ fontSize: size * 0.38 }}>
                            {initial}
                        </Text>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
}

function DateLabel({ text }: { text: string }) {
    return (
        <View className="items-center my-4">
            <View className="bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-1.5">
                <Text className="text-slate-400 text-[11px] font-semibold tracking-wide">
                    {text}
                </Text>
            </View>
        </View>
    );
}

export default function ChatScreen() {
    const { id: receiverId } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<formatMessageType[] | formatLabelType[]>([]);
    const [isReplyTo, setIsReplyTo] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ServerMessage | null>(null);
    const router = useRouter();
    const { data: userInfo } = useUserInfo();
    const { receiver } = useReceiver();
    const selectionType = receiver?.selectionType;
    const insets = useSafeAreaInsets();
    const group = receiver?.receiver as Group | undefined;
    const isAdmin = group?.members?.some(
        (member) => member?.user?._id === userInfo?._id && member.role === 'admin'
    );
    const isOwner = group?.createdBy?._id === userInfo?._id;
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const queryClient = useQueryClient();
    const flatListRef = useRef<FlatList>(null);

    const canSendMessage =
        (selectionType === 'group' &&
            (!group?.settings?.adminOnlyMessages || isAdmin || isOwner)) ||
        selectionType === 'private';

    const { data: chats = [], isLoading } = useQuery<ServerMessage[]>({
        queryKey: ['chats', receiverId, selectionType],
        queryFn: () => {
            if (selectionType === 'group') {
                return getChats(undefined, undefined, receiverId as string);
            }
            return getChats(userInfo?._id, receiverId as string);
        },
        enabled: !!userInfo?._id && !!receiverId,
    });

    useEffect(() => {
        if (receiverId && userInfo?._id) {
            if (selectionType === 'group') {
                socketHandlers.joinGroup(receiverId as string, userInfo._id);
            } else {
                socketHandlers.joinRoom(userInfo._id, receiverId as string);
            }
        }
        return () => {
            if (receiverId && userInfo?._id && selectionType === 'group') {
                socketHandlers.leaveGroup(receiverId as string, userInfo._id);
            }
            if (receiverId && userInfo?._id && selectionType === 'private') {
                socketHandlers.leaveRoom(userInfo._id, receiverId as string);
            }
        };
    }, [receiverId, userInfo?._id, selectionType]);

    useEffect(() => {
        if (chats && !isLoading) {
            setMessages(transformMessages(chats));
        }
    }, [chats, isLoading]);

    useEffect(() => {
        const lastMessageItem = [...messages].reverse().find((item) => item.type === 'message');
        const lastlabelDate = lastMessageItem?.data?.createdAt;
        setupSocketListeners(setMessages, lastlabelDate as Date | string);
        return () => cleanupSocketListeners();
    }, [messages]);

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim() || !userInfo?._id || !receiverId) return;

        if (selectionType === 'group') {
            socketHandlers.sendMessage({
                senderId: userInfo._id,
                groupId: receiverId as string,
                content: message.trim(),
                messageType: 'group',
                replyTo: selectedMessage?._id,
            });
        } else {
            socketHandlers.sendMessage({
                senderId: userInfo._id,
                receiverId: receiverId as string,
                content: message.trim(),
                messageType: 'private',
                replyTo: selectedMessage?._id,
            });
        }
        setMessage('');
        setSelectedMessage(null);
        setIsReplyTo(false);
    };

    const { mutate: leaveGroupMutation, isPending: isLeavingGroup } = useMutation({
        mutationFn: async (groupId: string) => leaveGroup(groupId),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'You have left the group successfully.' });
            router.back();
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const { mutate: deleteGroupMutation, isPending: isDeletingGroup } = useMutation({
        mutationFn: async (groupId: string) => {
            const response = await deleteGroup(groupId);
            return response.data;
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Group has been deleted successfully' });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            router.back();
        },
    });

    const subtitle =
        selectionType === 'group'
            ? `${group?.members?.length ?? 0} members`
            : 'Direct message';

    const profilePic = receiver?.receiver?.profilePic;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: BG }} edges={['top', 'left', 'right']}>
            <AuthGuard>
                <View className="flex-1" style={{ backgroundColor: BG }}>
                    {/* Header */}
                    <View
                        className="flex-row items-center px-4 pb-3 border-b border-white/[0.06]"
                        style={{ paddingTop: 4 }}
                    >
                        <TouchableOpacity
                            onPress={() => router.navigate('/contacts')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}
                            className="w-10 h-10 rounded-xl bg-white/[0.06] items-center justify-center mr-3"
                        >
                            <Ionicons name="chevron-back" size={22} color="#a5b4fc" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 flex-row items-center"
                            activeOpacity={0.8}
                            onPress={() => {
                                if (selectionType === 'group') {
                                    requestAnimationFrame(() => bottomSheetRef.current?.present());
                                }
                            }}
                        >
                            <Avatar
                                uri={profilePic ?? undefined}
                                name={receiver?.receiver?.name}
                                isGroup={selectionType === 'group'}
                            />
                            <View className="flex-1 ml-3">
                                <Text
                                    className="text-white text-[17px] font-bold tracking-tight"
                                    numberOfLines={1}
                                >
                                    {receiver?.receiver?.name || 'Unknown'}
                                </Text>
                                <View className="flex-row items-center mt-0.5 gap-1.5">
                                    {selectionType === 'group' ? (
                                        <Ionicons name="people" size={12} color="#64748b" />
                                    ) : (
                                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )}
                                    <Text className="text-slate-500 text-[12px]">{subtitle}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {selectionType === 'group' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <TouchableOpacity
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        activeOpacity={0.7}
                                        className="w-10 h-10 rounded-xl bg-white/[0.06] items-center justify-center"
                                    >
                                        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="mr-2 bg-[#12151F] rounded-2xl shadow-lg border border-white/10 min-w-[200px]">
                                    {(isAdmin ||
                                        isOwner ||
                                        group?.settings?.allowMemberInvite) && (
                                        <DropdownMenuItem>
                                            <Ionicons name="person-add-outline" size={20} color="#818cf8" />
                                            <Text className="text-slate-200 ml-2">Add Member</Text>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onPress={() => {
                                            requestAnimationFrame(() =>
                                                bottomSheetRef.current?.present()
                                            );
                                        }}
                                    >
                                        <Ionicons
                                            name="information-circle-outline"
                                            size={20}
                                            color="#818cf8"
                                        />
                                        <Text className="text-slate-200 ml-2">Group Info</Text>
                                    </DropdownMenuItem>
                                    {(isAdmin || isOwner) && (
                                        <DropdownMenuItem>
                                            <Ionicons
                                                name="person-remove-outline"
                                                size={20}
                                                color="#818cf8"
                                            />
                                            <Text className="text-slate-200 ml-2">Remove Member</Text>
                                        </DropdownMenuItem>
                                    )}
                                    {(isAdmin ||
                                        isOwner ||
                                        !group?.settings?.isPrivate) && (
                                        <DropdownMenuItem
                                            onPress={() =>
                                                router.push(`/group/${receiver?.receiver?._id}`)
                                            }
                                        >
                                            <Ionicons name="pencil-outline" size={20} color="#818cf8" />
                                            <Text className="text-slate-200 ml-2">Edit Group</Text>
                                        </DropdownMenuItem>
                                    )}
                                    {!isOwner ? (
                                        <DropdownMenuItem
                                            onPress={() => {
                                                if (!isLeavingGroup) {
                                                    leaveGroupMutation(receiverId as string);
                                                }
                                            }}
                                            disabled={isLeavingGroup}
                                        >
                                            <Ionicons name="exit-outline" size={20} color="#f87171" />
                                            <Text className="text-red-400 ml-2">Leave Group</Text>
                                            {isLeavingGroup && (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#818cf8"
                                                    className="ml-2"
                                                />
                                            )}
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onPress={() => {
                                                if (!isDeletingGroup) {
                                                    deleteGroupMutation(receiverId as string);
                                                }
                                            }}
                                            disabled={isDeletingGroup}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#f87171" />
                                            <Text className="text-red-400 ml-2">Delete Group</Text>
                                            {isDeletingGroup && (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#818cf8"
                                                    className="ml-2"
                                                />
                                            )}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </View>

                    {selectionType === 'group' && receiver?.receiver && (
                        <BottomSheetComponent
                            snapPoints={['70%']}
                            initialSnapIndex={0}
                            ref={bottomSheetRef}
                            className="bg-[#12151F]"
                        >
                            <GroupInfo group={receiver.receiver as Group} />
                        </BottomSheetComponent>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={
                            Platform.OS === 'ios' ? insets.top + HEADER_HEIGHT : 0
                        }
                        enabled
                        style={{ flex: 1 }}
                    >
                        {/* Messages area */}
                        <View className="flex-1">
                            <LinearGradient
                                colors={['#07090F', '#0B0F1A', '#07090F']}
                                locations={[0, 0.5, 1]}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            />

                            {isLoading ? (
                                <View className="flex-1 items-center justify-center">
                                    <ActivityIndicator size="large" color="#6366f1" />
                                    <Text className="text-slate-500 text-sm mt-4">
                                        Loading messages…
                                    </Text>
                                </View>
                            ) : messages.length === 0 ? (
                                <View className="flex-1 items-center justify-center px-8">
                                    <View className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mb-4">
                                        <Ionicons
                                            name="chatbubbles-outline"
                                            size={32}
                                            color="#818cf8"
                                        />
                                    </View>
                                    <Text className="text-white text-lg font-bold mb-2">
                                        No messages yet
                                    </Text>
                                    <Text className="text-slate-500 text-center text-sm leading-relaxed">
                                        Say hello to {receiver?.receiver?.name || 'them'} — your
                                        conversation starts here.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) =>
                                        item.type === 'label' ? (
                                            <DateLabel text={item.text} />
                                        ) : (
                                            <Message
                                                item={(item as formatMessageType).data as ServerMessage}
                                                setIsReplyTo={setIsReplyTo}
                                                selectedMessage={selectedMessage}
                                                setSelectedMessage={setSelectedMessage}
                                            />
                                        )
                                    }
                                    className="flex-1 px-3"
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="always"
                                    keyboardDismissMode="none"
                                    automaticallyAdjustKeyboardInsets
                                    contentContainerStyle={{
                                        paddingTop: 12,
                                        paddingBottom: insets.bottom + (isReplyTo ? 36 : 16),
                                    }}
                                    scrollEnabled
                                    nestedScrollEnabled
                                    removeClippedSubviews={false}
                                />
                            )}
                        </View>

                        {canSendMessage ? (
                            <View
                                className="px-3 pt-2"
                                style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
                            >
                                {/* Reply preview */}
                                {selectedMessage && isReplyTo && (
                                    <View className="flex-row items-start mb-2 mx-1 rounded-2xl overflow-hidden border border-indigo-500/30 bg-indigo-500/10">
                                        <View className="w-1 self-stretch bg-indigo-500" />
                                        <View className="flex-1 px-3 py-2.5">
                                            <Text className="text-indigo-300 text-[11px] font-semibold uppercase tracking-wide">
                                                Replying to {selectedMessage.sender.name}
                                            </Text>
                                            {selectedMessage.fileUrl ? (
                                                <View className="flex-row items-center mt-1.5">
                                                    {selectedMessage.fileType?.startsWith(
                                                        'image/'
                                                    ) && (
                                                        <Image
                                                            source={{ uri: selectedMessage.fileUrl }}
                                                            className="w-9 h-9 rounded-lg mr-2"
                                                        />
                                                    )}
                                                    <Text
                                                        numberOfLines={2}
                                                        className="text-slate-300 text-sm flex-shrink"
                                                    >
                                                        {selectedMessage.content || 'Attachment'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Text
                                                    numberOfLines={2}
                                                    className="text-slate-300 text-sm mt-1"
                                                >
                                                    {selectedMessage.content}
                                                </Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsReplyTo(false);
                                                setSelectedMessage(null);
                                            }}
                                            className="p-3"
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Ionicons name="close" size={18} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Composer */}
                                <View className="flex-row items-end gap-2 bg-[#12151F] border border-white/[0.08] rounded-[22px] px-3 py-2 mb-8">
                                    <TouchableOpacity
                                        className="w-9 h-9 rounded-full bg-white/[0.06] items-center justify-center mb-0.5"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="add" size={22} color="#818cf8" />
                                    </TouchableOpacity>

                                    <TextInput
                                        value={message}
                                        onChangeText={setMessage}
                                        placeholder="Message…"
                                        placeholderTextColor="#334155"
                                        className="flex-1 text-[15px] text-slate-100 max-h-28 py-2.5 px-1"
                                        multiline
                                        style={{ lineHeight: 20 }}
                                    />

                                    <TouchableOpacity
                                        onPress={sendMessage}
                                        disabled={!message.trim()}
                                        activeOpacity={0.85}
                                        className="mb-0.5"
                                    >
                                        <LinearGradient
                                            colors={
                                                message.trim()
                                                    ? ['#6366f1', '#4f46e5']
                                                    : ['#1e293b', '#1e293b']
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons
                                                name="send"
                                                size={18}
                                                color={message.trim() ? '#fff' : '#475569'}
                                                style={{ marginLeft: 2 }}
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View
                                className="mx-4 mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5"
                                style={{ marginBottom: Math.max(insets.bottom, 12) + 8 }}
                            >
                                <View className="flex-row items-center gap-2">
                                    <Ionicons name="lock-closed" size={16} color="#fbbf24" />
                                    <Text className="text-amber-200/90 text-sm font-medium flex-1">
                                        Only admins can send messages in this group
                                    </Text>
                                </View>
                            </View>
                        )}
                    </KeyboardAvoidingView>

                    {(isLeavingGroup || isDeletingGroup) && (
                        <Modal transparent visible animationType="fade">
                            <View className="flex-1 bg-black/70 items-center justify-center">
                                <View className="bg-[#12151F] border border-white/10 rounded-2xl p-8 items-center min-w-[220px]">
                                    <ActivityIndicator size="large" color="#6366f1" />
                                    <Text className="mt-4 text-slate-200 font-semibold text-base">
                                        {isLeavingGroup ? 'Leaving group…' : 'Deleting group…'}
                                    </Text>
                                </View>
                            </View>
                        </Modal>
                    )}
                </View>
            </AuthGuard>
        </SafeAreaView>
    );
}
