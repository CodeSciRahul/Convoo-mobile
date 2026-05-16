import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Button, FlatList, Image, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { useUserInfo } from '../hooks/useAuth';

import { socketHandlers } from '@/services/socketService';
import * as Haptics from 'expo-haptics';
import { Reply } from 'lucide-react-native';
import EmojiSelector from 'react-native-emoji-selector';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { Reaction, ServerMessage } from '../types';
import Popover from './popover';
import { BottomSheetComponent, BottomSheetRef } from './ui/bottom-sheet';
import { Button as ButtonUI } from './ui/Button';
import { PopoverContent, Popover as PopoverUI, PopoverTrigger, } from './ui/popover';


interface MessageProps {
    item: ServerMessage;
    setIsReplyTo: (value: boolean) => void;
    selectedMessage: ServerMessage | null;
    setSelectedMessage: (msg: ServerMessage | null) => void;
}

export default function Message({ item, setIsReplyTo, selectedMessage, setSelectedMessage }: MessageProps) {
    const { data: userInfo } = useUserInfo();
    const isMyMsg = userInfo?._id === item.sender._id;
    const isDeleted = item.deleted;
    const translateX = useSharedValue(0); // ye indepenendt swip ke liye required nhi to animation sabhe message show krne lagega.
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false)
    const [isDoubleTap, setIsDoubleTap] = useState<boolean>(false)
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(300)
        .maxDeltaY(10)
        .onEnd(() => {
            runOnJS(setSelectedMessage)((item))
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        });


    const panGesture = Gesture.Pan()
        // Require a clear horizontal intent to activate, which means the user has to swipe the message to the left or right.
        .activeOffsetX([-20, 20])
        // If vertical motion exceeds this, fail so FlatList can scroll
        .failOffsetY([-10, 10])
        // Minimum distance the user needs to swipe the message to the left or right.
        .minDistance(12)
        .onUpdate((e) => {
            if (e.translationX > 0) {
                translateX.value = e.translationX;
            }
        })
        .onEnd(async () => {
            if (translateX.value > 50) {
                runOnJS(setIsReplyTo)(true)
                runOnJS(setSelectedMessage)((item))
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
            translateX.value = withSpring(0, { damping: 15 });
        });

    const animatedBubbleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedReplyIcon = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, 60], [0, 1]),
        transform: [{ scale: interpolate(translateX.value, [0, 80], [0.8, 1]) }],
    }));


    const combinedGesture = Gesture.Simultaneous(doubleTap, panGesture);

    const renderReactions = (reactions: Reaction[]) => {
        if (!reactions || reactions.length === 0) return null;

        const reactionCounts = reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return (
            <View className="flex-row flex-wrap mt-1">
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <View key={emoji} className="">
                        <Text className="text-xl">
                            {emoji as string}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderReplyTo = (replyTo: ServerMessage | null) => {
        if (!replyTo) return null;

        return (
            <View className="bg-black/20 rounded-xl p-2.5 mb-2 border-l-[3px] border-indigo-400">
                <Text className="text-[11px] text-indigo-300 font-semibold">
                    {replyTo?.sender?.name}
                </Text>
                <Text className="text-sm text-slate-300 mt-0.5" numberOfLines={2}>
                    {replyTo?.content || 'File message'}
                </Text>
            </View>
        );
    };

    const renderFileMessage = (message: ServerMessage) => {
        const isImage = message.fileType?.startsWith('image/');
        const isVideo = message.fileType?.startsWith('video/');
        const isAudio = message.fileType?.startsWith('audio/');

        return (
            <View>
                {isImage && (
                    <Image
                        source={{ uri: message.fileUrl }}
                        className="w-48 h-48 rounded-lg"
                        resizeMode="cover"
                    />
                )}
                {isVideo && (
                    <View className="w-48 h-32 bg-gray-800 rounded-lg items-center justify-center">
                        <Ionicons name="play-circle" size={40} color="white" />
                        <Text className="text-white text-sm mt-1">Video</Text>
                    </View>
                )}
                {isAudio && (
                    <View className="flex-row items-center bg-gray-100 rounded-lg p-3">
                        <Ionicons name="musical-notes" size={24} color="#666" />
                        <Text className="text-gray-700 ml-2">Audio Message</Text>
                    </View>
                )}
                {!isImage && !isVideo && !isAudio && (
                    <View className="flex-row items-center bg-gray-100 rounded-lg p-3">
                        <Ionicons name="document" size={24} color="#666" />
                        <Text className="text-gray-700 ml-2">File</Text>
                    </View>
                )}
                {message.content && (
                    <Text className={`text-[15px] mt-2 ${isMyMsg ? 'text-white' : 'text-slate-100'}`}>
                        {message.content}
                    </Text>
                )}
            </View>
        );
    };

    const handleRemoveReaction = (reactionId: string) => {
        socketHandlers.removeReaction(item._id, reactionId)
    }

    // const handleAddReaction = (emoji: string) => {
    //     socketHandlers.addReaction(item._id, emoji)
    // }

    return (
        <>
            <GestureHandlerRootView>
                <GestureDetector gesture={combinedGesture}>
                    <View className="relative">
                        <Animated.View style={animatedReplyIcon} className="absolute left-5">
                            <Reply size={22} color="#818cf8" />
                        </Animated.View>
                        <Pressable
                            onLongPress={() => {
                                setSelectedMessage(item)
                                setIsPopoverOpen(true)
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            delayLongPress={400}
                            className={`mb-3 px-1 ${isMyMsg ? 'items-end' : 'items-start'} ${selectedMessage?._id === item._id ? 'bg-indigo-500/10 rounded-2xl py-1' : ''}`}
                        >
                            {!isMyMsg && item.messageType === 'group' && (
                                <Text className="text-[11px] text-indigo-400/80 font-medium mb-1 ml-1">
                                    {item.sender?.name}
                                </Text>
                            )}
                            <Animated.View
                                style={animatedBubbleStyle}
                                className={`relative max-w-[82%] px-4 py-3 rounded-[18px] ${isMyMsg
                                    ? 'bg-indigo-600 rounded-br-[4px]'
                                    : 'bg-white/[0.08] border border-white/[0.06] rounded-bl-[4px]'
                                    }`}
                            >
                                {/* Reply to message */}
                                {renderReplyTo(item?.replyTo || null)}

                                {/* Message content */}
                                {isDeleted ? (
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name="trash"
                                            size={16}
                                            color={isMyMsg ? '#ccc' : '#666'}
                                        />
                                        <Text className={`text-sm ml-2 italic ${isMyMsg ? 'text-indigo-200/70' : 'text-slate-500'}`}>
                                            This message was deleted
                                        </Text>
                                    </View>
                                ) : item.fileUrl ? (
                                    renderFileMessage(item)
                                ) : (
                                    <Text
                                        className={`text-[15px] leading-[21px] ${isMyMsg ? 'text-white' : 'text-slate-100'}`}
                                    >
                                        {item.content}
                                    </Text>
                                )}

                                {/* Reactions */}
                                <View className="absolute bottom-[-7px] left-1">
                                    <TouchableOpacity onPress={() => bottomSheetRef.current?.present()}>
                                        {renderReactions(item?.reactions || [])}
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            <Text className={`text-[10px] mt-1 ${isMyMsg ? 'text-slate-600' : 'text-slate-600'}`}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </Pressable>
                    </View>
                </GestureDetector>
            </GestureHandlerRootView>


            {/* Popover */}
            {selectedMessage?._id === item._id && isPopoverOpen && <Popover
                visible={isPopoverOpen}
                onClose={() => setIsPopoverOpen(false)}
                onDeselectMessage={() => setSelectedMessage(null)}
                isMyMessage={isMyMsg}
                onForward={() => { }}
                onDelete={() => { }}
                onCopy={() => { }}
            />}

            <BottomSheetComponent
                snapPoints={['50%']}
                initialSnapIndex={0}
                ref={bottomSheetRef}
                className="bg-[#111827]"
            >
                <FlatList
                    data={item?.reactions || []}
                    renderItem={({ item: reaction }: { item: Reaction }) => (
                        <View className="px-3 py-2 flex-row items-center justify-between">
                            <Text className="text-3xl mr-3">{reaction.emoji}</Text>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-white">{reaction.user.name}</Text>
                                <Text className="text-xs text-gray-500 mt-0.5">{
                                    new Date(item?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }</Text>
                            </View>
                            {reaction.user._id === userInfo?._id && <TouchableOpacity
                                className="p-2 rounded-full"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                activeOpacity={0.7}
                                onPress={() => handleRemoveReaction(reaction._id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>}
                        </View>
                    )}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                />
            </BottomSheetComponent>
        </>
    );
}