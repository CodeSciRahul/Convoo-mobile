import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const AVATAR = 52;

export function formatChatTime(timestamp?: string) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 86_400_000;
    if (diff < oneDay && date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * oneDay) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface ChatListRowProps {
    name: string;
    subtitle?: string;
    timestamp?: string;
    avatarUri?: string | null;
    unreadCount?: number;
    isGroup?: boolean;
    selected?: boolean;
    meta?: string;
    onPress: () => void;
    onLongPress?: () => void;
}

export default function ChatListRow({
    name,
    subtitle,
    timestamp,
    avatarUri,
    unreadCount = 0,
    isGroup,
    selected,
    meta,
    onPress,
    onLongPress,
}: ChatListRowProps) {
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.75}
            className={`mx-4 mb-2 rounded-2xl border overflow-hidden ${
                selected
                    ? 'bg-indigo-500/15 border-indigo-500/35'
                    : 'bg-white/[0.04] border-white/[0.06]'
            }`}
        >
            <View className="flex-row items-center p-3.5">
                <View style={{ width: AVATAR, height: AVATAR }}>
                    <LinearGradient
                        colors={isGroup ? ['#7c3aed', '#4f46e5'] : ['#6366f1', '#4f46e5']}
                        style={{
                            width: AVATAR,
                            height: AVATAR,
                            borderRadius: AVATAR / 2,
                            padding: 2,
                        }}
                    >
                        <View
                            className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center"
                        >
                            {avatarUri ? (
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={{
                                        width: AVATAR - 4,
                                        height: AVATAR - 4,
                                        borderRadius: (AVATAR - 4) / 2,
                                    }}
                                />
                            ) : isGroup ? (
                                <Ionicons name="people" size={22} color="#a5b4fc" />
                            ) : (
                                <Text className="text-white font-bold text-lg">{initial}</Text>
                            )}
                        </View>
                    </LinearGradient>
                    {selected && (
                        <View className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 rounded-full border-2 border-[#07090F]">
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                    )}
                </View>

                <View className="flex-1 ml-3.5 min-w-0">
                    <View className="flex-row items-center justify-between mb-0.5">
                        <Text
                            className="text-white text-[16px] font-semibold flex-1 mr-2"
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        {timestamp ? (
                            <Text className="text-slate-500 text-[11px]">{timestamp}</Text>
                        ) : null}
                    </View>

                    <View className="flex-row items-center">
                        <Text className="text-slate-500 text-sm flex-1" numberOfLines={1}>
                            {subtitle || 'No messages yet'}
                        </Text>
                        {meta ? (
                            <Text className="text-slate-600 text-[11px] ml-2">{meta}</Text>
                        ) : null}
                        {unreadCount > 0 && (
                            <View className="bg-indigo-500 min-w-[22px] h-[22px] rounded-full items-center justify-center ml-2 px-1.5">
                                <Text className="text-white text-[11px] font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
