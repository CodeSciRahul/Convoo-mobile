import { useUserInfo } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#07090F';

const MENU_ITEMS: {
    route: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
}[] = [
    {
        route: '(tab)',
        label: 'Chats',
        icon: 'chatbubbles-outline',
        description: 'Messages & contacts',
    },
    {
        route: 'profile',
        label: 'Profile',
        icon: 'person-outline',
        description: 'Your account',
    },
    {
        route: 'setting',
        label: 'Settings',
        icon: 'settings-outline',
        description: 'Preferences & logout',
    },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { state, navigation } = props;
    const insets = useSafeAreaInsets();
    const { data: user } = useUserInfo();

    const activeRoute = state.routes[state.index]?.name;
    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    const navigate = (route: string) => {
        navigation.navigate(route as never);
    };

    return (
        <View className="flex-1" style={{ backgroundColor: BG }}>
            <LinearGradient
                colors={['#12151F', '#07090F', '#07090F']}
                locations={[0, 0.35, 1]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
            />

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{
                    paddingTop: insets.top + 8,
                    paddingBottom: insets.bottom + 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Brand */}
                <View className="px-5 pb-6">
                    <View className="flex-row items-center gap-3.5">
                        <LinearGradient
                            colors={['#6366f1', '#4f46e5', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 16,
                                padding: 2,
                            }}
                        >
                            <View
                                className="flex-1 rounded-[14px] overflow-hidden bg-[#0D1117] items-center justify-center"
                            >
                                <Image
                                    source={require('../assets/images/icon.png')}
                                    style={{ width: 44, height: 44, borderRadius: 12 }}
                                    resizeMode="cover"
                                />
                            </View>
                        </LinearGradient>
                        <View className="flex-1">
                            <Text className="text-white text-[22px] font-bold tracking-tight">
                                Convoo
                            </Text>
                            <View className="flex-row items-center gap-1.5 mt-0.5">
                                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <Text className="text-emerald-400/90 text-[10px] font-semibold tracking-widest uppercase">
                                    Secure chat
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* User card */}
                <TouchableOpacity
                    onPress={() => navigate('profile')}
                    activeOpacity={0.85}
                    className="mx-4 mb-6 rounded-2xl overflow-hidden border border-white/[0.08]"
                >
                    <LinearGradient
                        colors={['rgba(99,102,241,0.18)', 'rgba(79,70,229,0.08)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 14 }}
                    >
                        <View className="flex-row items-center gap-3">
                            <LinearGradient
                                colors={['#6366f1', '#4f46e5']}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {user?.profilePic ? (
                                    <Image
                                        source={{ uri: user.profilePic }}
                                        style={{ width: 40, height: 40, borderRadius: 20 }}
                                    />
                                ) : (
                                    <Text className="text-white text-lg font-bold">{initial}</Text>
                                )}
                            </LinearGradient>
                            <View className="flex-1 min-w-0">
                                <Text
                                    className="text-white text-[15px] font-bold"
                                    numberOfLines={1}
                                >
                                    {user?.name || 'Guest'}
                                </Text>
                                <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                                    {user?.email || 'View profile'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#64748b" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Nav label */}
                <Text className="px-6 text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-3">
                    Menu
                </Text>

                {/* Nav items */}
                <View className="px-4 gap-1.5">
                    {MENU_ITEMS.map((item) => {
                        const focused = activeRoute === item.route;
                        return (
                            <TouchableOpacity
                                key={item.route}
                                onPress={() => navigate(item.route)}
                                activeOpacity={0.8}
                                className={`flex-row items-center rounded-2xl px-4 py-3.5 border ${
                                    focused
                                        ? 'bg-indigo-500/20 border-indigo-500/40'
                                        : 'bg-transparent border-transparent'
                                }`}
                            >
                                <View
                                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3.5 ${
                                        focused ? 'bg-indigo-500/30' : 'bg-white/[0.06]'
                                    }`}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={focused ? '#a5b4fc' : '#64748b'}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text
                                        className={`text-[15px] font-semibold ${
                                            focused ? 'text-white' : 'text-slate-300'
                                        }`}
                                    >
                                        {item.label}
                                    </Text>
                                    <Text className="text-slate-500 text-xs mt-0.5">
                                        {item.description}
                                    </Text>
                                </View>
                                {focused && (
                                    <View className="w-1.5 h-8 rounded-full bg-indigo-400" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer */}
                <View className="mx-4 mt-8 pt-6 border-t border-white/[0.06]">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-slate-600 text-xs">Convoo v1.0.0</Text>
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="shield-checkmark" size={12} color="#34d399" />
                            <Text className="text-emerald-500/80 text-[10px] font-medium">
                                End-to-end ready
                            </Text>
                        </View>
                    </View>
                </View>
            </DrawerContentScrollView>
        </View>
    );
}
