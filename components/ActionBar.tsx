import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActionBarProps {
    count: number;
    onDelete: () => void;
    onBlock?: () => void;
    onMute?: () => void;
    onCancel: () => void;
}

export function ActionBar({ count, onDelete, onBlock, onMute, onCancel }: ActionBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="px-4 pt-3 border-t border-white/[0.08]"
            style={{ paddingBottom: insets.bottom + 10, backgroundColor: '#12151F' }}
        >
            <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity
                    onPress={onCancel}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-2"
                >
                    <View className="w-8 h-8 rounded-xl bg-white/[0.08] items-center justify-center">
                        <Ionicons name="close" size={16} color="#94a3b8" />
                    </View>
                    <Text className="text-sm font-semibold text-slate-300">Cancel</Text>
                </TouchableOpacity>

                <View className="bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1">
                    <Text className="text-indigo-300 text-xs font-bold">{count} selected</Text>
                </View>
            </View>

            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={onDelete}
                    activeOpacity={0.75}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-red-500/15 border border-red-500/25"
                >
                    <Ionicons name="trash-outline" size={17} color="#f87171" />
                    <Text className="text-sm font-semibold text-red-400">Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onBlock}
                    activeOpacity={0.75}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08]"
                >
                    <Ionicons name="ban-outline" size={17} color="#94a3b8" />
                    <Text className="text-sm font-semibold text-slate-400">Block</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onMute}
                    activeOpacity={0.75}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08]"
                >
                    <Ionicons name="volume-mute-outline" size={17} color="#94a3b8" />
                    <Text className="text-sm font-semibold text-slate-400">Mute</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
