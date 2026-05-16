// components/ActionBar.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionBarProps {
  count: number;
  onDelete: () => void;
  onBlock?: () => void;
  onMute?: () => void;
  onCancel: () => void;
  isDark: boolean;
}

export function ActionBar({
  count,
  onDelete,
  onBlock,
  onMute,
  onCancel,
  isDark,
}: ActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-4 pt-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#141414]"
      style={{ paddingBottom: insets.bottom + 10 }}
    >
      {/* Top row: cancel + count pill */}
      <View className="flex-row items-center justify-between mb-2">

        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <View className="w-7 h-7 rounded-full items-center justify-center bg-black/5 dark:bg-white/10">
            <Ionicons
              name="close"
              size={15}
              color={isDark ? "#cccccc" : "#444444"}
            />
          </View>
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Cancel
          </Text>
        </TouchableOpacity>

        <View className="bg-blue-500 rounded-full px-3 py-0.5">
          <Text className="text-white text-xs font-semibold">
            {count} selected
          </Text>
        </View>

      </View>

      {/* Action buttons */}
      <View className="flex-row gap-2">

        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.75}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40"
        >
          <Ionicons name="trash-outline" size={17} color="#b91c1c" />
          <Text className="text-sm font-medium text-red-700 dark:text-red-400">
            Delete
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBlock}
          activeOpacity={0.75}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10"
        >
          <Ionicons
            name="ban-outline"
            size={17}
            color={isDark ? "#cccccc" : "#555555"}
          />
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Block
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMute}
          activeOpacity={0.75}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10"
        >
          <Ionicons
            name="volume-mute-outline"
            size={17}
            color={isDark ? "#cccccc" : "#555555"}
          />
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Mute
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}