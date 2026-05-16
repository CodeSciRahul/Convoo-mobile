import GroupInfo from '@/components/GroupInfo';
import Message from '@/components/Message';
import { BottomSheetComponent, BottomSheetRef } from '@/components/ui/bottom-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AuthGuard from '../../components/AuthGuard';
import { useUserInfo } from '../../hooks/useAuth';
import { deleteGroup, getChats, leaveGroup } from '../../services/apiServices';
import { cleanupSocketListeners, setupSocketListeners, socketHandlers } from "../../services/socketService";
import { Group, ServerMessage } from '../../types';
import { useReceiver } from '../../zustand/receiver.store';
import { transformMessages } from '@/util/formatMessage';
import { formatMessageType, formatLabelType } from '@/types';
export default function ChatScreen() {
  const HEADER_HEIGHT = 56;
  const { id: receiverId } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<formatMessageType[] | formatLabelType[]>([]);
  const [isReplyTo, setIsReplyTo] = useState<boolean>(false)
  const [selectedMessage, setSelectedMessage] = useState<ServerMessage | null>(null)
  const router = useRouter();
  const { data: userInfo } = useUserInfo();
  const { receiver } = useReceiver();
  const selectionType = receiver?.selectionType;
  const insets = useSafeAreaInsets();
  const isAdmin = (receiver?.receiver as Group)?.members?.some((member) => member?.user?._id === userInfo?._id && member.role === 'admin');
  const isOwner = (receiver?.receiver as Group)?.createdBy?._id === userInfo?._id
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const queryClient = useQueryClient()
  const { data: chats = [], isLoading } = useQuery<ServerMessage[]>({
    queryKey: ['chats', receiverId, selectionType],
    queryFn: () => {
      if (selectionType === 'group') {
        return getChats(undefined, undefined, receiverId as string);
      } else {
        return getChats(userInfo?._id, receiverId as string);
      }
    },
    enabled: !!userInfo?._id && !!receiverId,
  });

  const flatListRef = useRef(null)

  //join room
  useEffect(() => {
    if (receiverId && userInfo?._id) {
      if (selectionType === 'group') {
        socketHandlers.joinGroup(receiverId as string, userInfo?._id);
      } else {
        socketHandlers.joinRoom(userInfo?._id, receiverId as string);
      }
    }

    // Cleanup function to leave group when component unmounts or selection changes
    return () => {
      if (receiverId && userInfo?._id && selectionType === 'group') {
        socketHandlers.leaveGroup(receiverId as string, userInfo?._id);
      }
      if (receiverId && userInfo?._id && selectionType === 'private') {
        socketHandlers.leaveRoom(userInfo?._id, receiverId as string);
      }
    };
  }, [receiverId, userInfo?._id, selectionType]);

  // set messages
  useEffect(() => {
    if (chats && !isLoading) {
      setMessages(transformMessages(chats));
    }
  }, [chats, isLoading]);

  // listen for new events or messages
  useEffect(() => {
    const lastMessageItem = [...messages]
      .reverse()
      .find((item) => item.type === "message");

    const lastlabelDate = lastMessageItem?.data?.createdAt;
    setupSocketListeners(setMessages, lastlabelDate as Date | string);

    return () => {
      cleanupSocketListeners();
    };
  }, [messages]);


  const sendMessage = () => {
    if (!message.trim() || !userInfo?._id || !receiverId) return;

    if (selectionType === 'group') {
      socketHandlers.sendMessage({
        senderId: userInfo?._id,
        groupId: receiverId as string,
        content: message.trim(),
        messageType: 'group',
        replyTo: selectedMessage?._id
      });
    } else {
      socketHandlers.sendMessage({
        senderId: userInfo?._id,
        receiverId: receiverId as string,
        content: message.trim(),
        messageType: 'private',
        replyTo: selectedMessage?._id
      });
    }
    setMessage('');
    setSelectedMessage(null)
    setIsReplyTo(false)
  }

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      (flatListRef.current as any).scrollToEnd({ animated: true })
    }

  }, [messages])

  const { mutate: leaveGroupMutation, isPending: isLeavingGroup } = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await leaveGroup(groupId)
      return response
    },
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1: "You have left the group successfully."
      })
      router.back()
      queryClient.invalidateQueries({
        queryKey: ["groups"]
      })
    }
  })

  const { mutate: deleteGroupMutation, isPending: isDeletingGroup } = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await deleteGroup(groupId)
      return response.data
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Group has been deleted successfully"
      })
      queryClient.invalidateQueries({
        queryKey: ["groups"]
      })
      router.back()
    }
  })


  return (
    <SafeAreaView className='flex-1' edges={['top', 'left', 'right']}>
      <AuthGuard>
        <View className="flex-1 bg-white dark:bg-[#181818]">
          {/* Header */}
          <View className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#181818] flex flex-row">
            <View className="flex-1 flex-row items-center">
              <TouchableOpacity
                className="mr-3"
                onPress={() => router.navigate('/contacts')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                {receiver?.receiver?.profilePic ? (
                  <Image source={{ uri: receiver.receiver.profilePic }} className="w-10 h-10 rounded-full" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {receiver?.receiver?.name?.charAt(0) || 'U'}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {receiver?.receiver?.name || 'Unknown User'}
                </Text>
                {/* <Text className="text-sm text-green-500">Online</Text> */}
              </View>
            </View>
            {selectionType === 'group' && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" className="mr-2" />
                </TouchableOpacity>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                {(isAdmin || isOwner || (receiver?.receiver as Group).settings?.allowMemberInvite) && <DropdownMenuItem>
                  <Ionicons name='person-add' size={24} color="#007AFF" className='mr-2' />
                  <Text className="dark:text-gray-100">Add Member</Text>
                </DropdownMenuItem>}
                <DropdownMenuItem onPress={() => { requestAnimationFrame(() => bottomSheetRef.current?.present()); }}>
                  <Ionicons name="information-circle-outline" size={24} color="#007AFF" className="mr-2" />
                  <Text className="dark:text-gray-100">Group Info</Text>
                </DropdownMenuItem>
                {(isAdmin || isOwner) && <DropdownMenuItem>
                  <Ionicons name='person-remove' size={24} color="#007AFF" className='mr-2' />
                  <Text className="dark:text-gray-100">Remove Member</Text>
                </DropdownMenuItem>}
                {(isAdmin || isOwner || !(receiver?.receiver as Group).settings?.isPrivate) && <DropdownMenuItem onPress={() => router.push(`/group/${receiver?.receiver?._id}`)}>
                  <Ionicons name="pencil-outline" size={24} color="#007AFF" className="mr-2" />
                  <Text className="dark:text-gray-100">Edit Group</Text>
                </DropdownMenuItem>}
                {!isOwner ? (
                  <>
                    <DropdownMenuItem
                      onPress={() => {
                        if (!isLeavingGroup) {
                          leaveGroupMutation(receiverId as string)
                        }
                      }}
                      disabled={isLeavingGroup}
                    >
                      <Ionicons name="exit-outline" size={24} color="#007AFF" className="mr-2" />
                      <Text className="dark:text-gray-100">Leave Group</Text>
                      {isLeavingGroup && (
                        <View className="ml-2">
                          <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                      )}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onPress={() => {
                        if (!isDeletingGroup) {
                          deleteGroupMutation(receiverId as string)
                        }
                      }}
                      disabled={isDeletingGroup}
                    >
                      <Ionicons name="trash-outline" size={24} color="#007AFF" className="mr-2" />
                      <Text className="dark:text-gray-100">Delete Group</Text>
                      {isDeletingGroup && (
                        <View className="ml-2">
                          <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>}
          </View>

          {/* Group Info Bottom Sheet */}
          {selectionType === 'group' && receiver?.receiver ? (
            <BottomSheetComponent
              snapPoints={['70%']}
              initialSnapIndex={0}
              ref={bottomSheetRef}
            >
              <GroupInfo group={receiver.receiver as Group} />
            </BottomSheetComponent>
          ) : null}

          {/* Message + Input (wrap in KAV on iOS, exclude header) */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_HEIGHT : 0}
            enabled
            style={{ flex: 1 }}
          >
            {/* Messages */}
            <View className="flex-1">
              {!isLoading ? (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    item.type === 'label' ? (
                      <Text
                        key={item.id}
                        className="text-gray-600 dark:text-gray-300 font-medium text-center py-2">{item.text}</Text>
                    ) : (
                      <Message
                        item={(item as formatMessageType)?.data as ServerMessage}
                        key={item.id}
                        setIsReplyTo={setIsReplyTo}
                        selectedMessage={selectedMessage}
                        setSelectedMessage={setSelectedMessage}
                      />
                    )
                  )}
                  className="flex-1 px-4 py-2"
                  // Hide the vertical scroll bar, for cleaner UI like WhatsApp
                  showsVerticalScrollIndicator={false}

                  // Ensure tapping on messages or other elements doesn't dismiss the keyboard
                  // 'always' means keyboard will stay open even when tapping on items
                  keyboardShouldPersistTaps="always"

                  // Prevent the keyboard from dismissing when scrolling the FlatList
                  // 'none' ensures keyboard stays open while user scrolls
                  keyboardDismissMode="none"

                  // Automatically adjust FlatList padding/insets for keyboard and safe area
                  // Helps avoid overlapping input bar on iOS 15+ or Android insets
                  automaticallyAdjustKeyboardInsets

                  // Extra padding at the bottom to avoid content being hidden behind input bar or reply preview
                  contentContainerStyle={{ paddingBottom: insets.bottom + (isReplyTo ? 30 : 20) }}

                  // Allow scrolling of the list
                  scrollEnabled={true}

                  // Allow FlatList inside another scrollable view (nested scroll) to scroll properly
                  nestedScrollEnabled

                  // Do not remove items that are outside of viewport for smoother animations and gestures
                  removeClippedSubviews={false}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </View>

            {((selectionType === 'group' &&
              (!(receiver?.receiver as Group)?.settings?.adminOnlyMessages) || isAdmin || isOwner
            ) ||
              (selectionType === 'private') ? (
              <>
                {/* Message Input Bar */}
                <View className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#181818] z-1" style={{ paddingBottom: insets.bottom + 30 }}>
                  {/* --- Reply Preview (if any) --- */}
                  {selectedMessage && isReplyTo && (
                    <View className="flex-row items-start px-4 py-2 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          Replying to {selectedMessage.sender.name}
                        </Text>

                        {/* If it's an image/file message */}
                        {selectedMessage.fileUrl ? (
                          <View className="flex-row items-center mt-1">
                            {selectedMessage.fileType?.startsWith("image/") && (
                              <Image
                                source={{ uri: selectedMessage.fileUrl }}
                                className="w-10 h-10 rounded mr-2"
                              />
                            )}
                            <Text
                              numberOfLines={2}
                              className="text-sm text-gray-700 dark:text-gray-200 flex-shrink"
                            >
                              {selectedMessage.content || "File message"}
                            </Text>
                          </View>
                        ) : (
                          <Text numberOfLines={2} className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                            {selectedMessage.content}
                          </Text>
                        )}
                      </View>

                      {/* Close (Cancel reply) */}
                      <TouchableOpacity
                        onPress={() => {
                          setIsReplyTo(false)
                          setSelectedMessage(null)
                        }}
                        className="ml-2 p-1"
                      >
                        <Ionicons name="close" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* --- Message Input Bar --- */}
                  <View className="flex-row items-center p-4 bg-white dark:bg-[#181818]">
                    <TouchableOpacity className="mr-3">
                      <Ionicons name="add" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 mr-3 dark:text-gray-100"
                      multiline
                    />

                    <TouchableOpacity
                      onPress={sendMessage}
                      className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
                    >
                      <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View className="border-t py-4 px-2 items-center justify-center border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg absolute bottom-2 left-0 right-0">
                <Text className="text-center font-medium text-gray-500 dark:text-gray-400 underline">You are not allowed to send message to this group</Text>
              </View>
            ))}
          </KeyboardAvoidingView>

          {/* Loading Overlay */}
          {(isLeavingGroup || isDeletingGroup) && (
            <Modal
              transparent
              visible={isLeavingGroup || isDeletingGroup}
              animationType="fade"
            >
              <View className="flex-1 bg-black/50 items-center justify-center">
                <View className="bg-white dark:bg-gray-900 rounded-lg p-6 items-center min-w-[200px]">
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text className="mt-4 text-gray-900 dark:text-gray-100 font-medium text-base">
                    {isLeavingGroup ? 'Leaving group...' : 'Deleting group...'}
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
