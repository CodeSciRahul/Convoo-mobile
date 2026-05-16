import { Switch } from '@/components/ui/switch';
import { useUserInfo } from '@/hooks/useAuth';
import { getGroupDetails, updateGroup } from '@/services/apiServices';
import { GroupDetailsResponse, UpdateGroupData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const BG = '#07090F';

interface UnderlineFieldProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    multiline?: boolean;
    editable?: boolean;
}

function UnderlineField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    multiline,
    editable = true,
}: UnderlineFieldProps) {
    const [focused, setFocused] = useState(false);
    const lineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(lineAnim, {
            toValue: focused && editable ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [focused, editable]);

    const lineWidth = lineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View className="mb-6">
            <Text
                className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${
                    focused && editable ? 'text-indigo-400' : 'text-slate-500'
                }`}
            >
                {label}
            </Text>
            <View className={`flex-row gap-3 pb-3 ${multiline ? 'items-start' : 'items-center'}`}>
                <Ionicons
                    name={icon}
                    size={16}
                    color={focused && editable ? '#818cf8' : '#334155'}
                    style={multiline ? { marginTop: 4 } : undefined}
                />
                <TextInput
                    className={`flex-1 text-[15px] p-0 m-0 ${multiline ? 'min-h-[72px]' : ''} ${
                        editable ? 'text-slate-100' : 'text-slate-500'
                    }`}
                    placeholder={placeholder}
                    placeholderTextColor="#1e293b"
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    numberOfLines={multiline ? 3 : 1}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
            <View className="h-px bg-white/[0.07]" />
            <Animated.View
                style={{ width: lineWidth }}
                className="h-px bg-indigo-500 absolute bottom-0 left-0"
            />
        </View>
    );
}

function SettingRow({
    icon,
    iconColor,
    title,
    subtitle,
    checked,
    onToggle,
    id,
    isLast,
    disabled,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    subtitle: string;
    checked: boolean;
    onToggle: () => void;
    id: string;
    isLast?: boolean;
    disabled?: boolean;
}) {
    return (
        <View
            className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-white/[0.06]' : ''} ${
                disabled ? 'opacity-50' : ''
            }`}
        >
            <TouchableOpacity
                className="flex-row items-center flex-1 mr-3"
                onPress={disabled ? undefined : onToggle}
                activeOpacity={disabled ? 1 : 0.8}
                disabled={disabled}
            >
                <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <View className="flex-1">
                    <Text className="text-slate-100 text-[15px] font-semibold">{title}</Text>
                    <Text className="text-slate-500 text-xs mt-0.5 leading-relaxed">{subtitle}</Text>
                </View>
            </TouchableOpacity>
            <Switch
                checked={checked}
                onCheckedChange={onToggle}
                id={id}
                nativeID={id}
                disabled={disabled}
            />
        </View>
    );
}

export default function UpdateGroupScreen() {
    const { id: groupId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const { data: userInfo } = useUserInfo();

    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupSettings, setGroupSettings] = useState({
        isPrivateGroup: false,
        allowMemberInvite: false,
        adminOnlyMessages: false,
    });

    const contentAnim = useRef(new Animated.Value(0)).current;

    const { data: groupDetails, isLoading: isLoadingGroup } = useQuery<GroupDetailsResponse>({
        queryKey: ['groupDetails', groupId],
        queryFn: async () => {
            const response = await getGroupDetails(groupId!);
            return response.data as GroupDetailsResponse;
        },
        enabled: !!groupId,
    });

    useEffect(() => {
        if (groupDetails?.group) {
            const group = groupDetails.group;
            setGroupName(group.name || '');
            setGroupDescription(group.description || '');
            setGroupSettings({
                isPrivateGroup: group.settings?.isPrivate || false,
                allowMemberInvite: group.settings?.allowMemberInvite || false,
                adminOnlyMessages: group.settings?.adminOnlyMessages || false,
            });
        }
    }, [groupDetails]);

    useEffect(() => {
        if (groupDetails?.group) {
            Animated.spring(contentAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        }
    }, [groupDetails?.group]);

    const slide = {
        opacity: contentAnim,
        transform: [
            {
                translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                }),
            },
        ],
    };

    const isAdmin = groupDetails?.group?.members?.some(
        (member) => member.user._id === userInfo?._id && member.role === 'admin'
    );
    const isOwner = groupDetails?.group?.createdBy._id === userInfo?._id;
    const canEditSettings = !!(isAdmin || isOwner);
    const canEditBasicInfo =
        !groupSettings.isPrivateGroup || canEditSettings;

    const { mutate: updateGroupMutation, isPending: isUpdatingGroup } = useMutation({
        mutationFn: async (payload: UpdateGroupData) => {
            const response = await updateGroup(groupId!, payload);
            return response.data;
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Group updated successfully' });
            queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
        onError: (error) => {
            Toast.show({
                type: 'error',
                text1:
                    (error as AxiosError<{ message: string }>)?.response?.data?.message ||
                    'Failed to update group',
            });
        },
    });

    function onSettingsPress(key: keyof typeof groupSettings) {
        if (!canEditSettings) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleUpdate() {
        if (!groupName.trim()) {
            Toast.show({ type: 'error', text1: 'Group name is required' });
            return;
        }

        updateGroupMutation({
            name: groupName.trim(),
            description: groupDescription.trim() || undefined,
            settings: {
                isPrivate: groupSettings.isPrivateGroup,
                allowMemberInvite: groupSettings.allowMemberInvite,
                adminOnlyMessages: groupSettings.adminOnlyMessages,
            },
        });
    }

    if (isLoadingGroup) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: BG }}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="mt-4 text-slate-500 text-sm">Loading group details…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!groupDetails?.group) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: BG }}>
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 items-center justify-center mb-4">
                        <Ionicons name="alert-circle-outline" size={32} color="#f87171" />
                    </View>
                    <Text className="text-white text-xl font-bold">Group not found</Text>
                    <Text className="mt-2 text-center text-slate-500 text-sm leading-relaxed">
                        This group doesn&apos;t exist or you don&apos;t have access to it.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.82}
                        className="mt-8 rounded-2xl overflow-hidden"
                    >
                        <LinearGradient
                            colors={['#6366f1', '#4f46e5']}
                            style={{ paddingHorizontal: 28, paddingVertical: 14 }}
                        >
                            <Text className="text-white font-bold text-[15px]">Go back</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const group = groupDetails.group;
    const initial = group.name?.charAt(0)?.toUpperCase() || 'G';
    const memberCount = group.members?.length ?? 0;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: BG }} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                style={{ backgroundColor: BG }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: 24,
                    }}
                >
                    <Animated.View style={slide}>
                        {/* Hero */}
                        <View className="items-center pt-2 pb-6">
                            <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-5">
                                Edit group
                            </Text>

                            <LinearGradient
                                colors={['#6366f1', '#4f46e5', '#7c3aed']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    padding: 3,
                                    marginBottom: 12,
                                }}
                            >
                                <View className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center">
                                    {group.profilePic ? (
                                        <Image
                                            source={{ uri: group.profilePic }}
                                            style={{ width: 94, height: 94, borderRadius: 47 }}
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={['#4f46e5', '#7c3aed']}
                                            style={{
                                                width: 94,
                                                height: 94,
                                                borderRadius: 47,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text className="text-white text-4xl font-bold">
                                                {initial}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </View>
                            </LinearGradient>

                            <Text className="text-white text-xl font-bold tracking-tight">
                                {group.name}
                            </Text>
                            <View className="flex-row items-center gap-1.5 mt-1.5">
                                <Ionicons name="people" size={13} color="#64748b" />
                                <Text className="text-slate-500 text-sm">
                                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                </Text>
                            </View>
                            {!canEditBasicInfo && (
                                <View className="mt-3 flex-row items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                    <Ionicons name="lock-closed" size={14} color="#fbbf24" />
                                    <Text className="text-amber-200/90 text-xs ml-2 flex-1">
                                        Private group — only admins can edit details
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Basic info */}
                        <View className="bg-[#12151F] border border-white/[0.08] rounded-2xl px-5 pt-5 pb-2 mb-5">
                            <Text className="text-white text-[15px] font-bold mb-4">Basic info</Text>

                            <UnderlineField
                                label="Group name"
                                icon="chatbubbles-outline"
                                placeholder="Group name"
                                value={groupName}
                                onChangeText={setGroupName}
                                editable={canEditBasicInfo}
                            />

                            <UnderlineField
                                label="Description"
                                icon="document-text-outline"
                                placeholder="What's this group about?"
                                value={groupDescription}
                                onChangeText={setGroupDescription}
                                multiline
                                editable={canEditBasicInfo}
                            />
                        </View>

                        {/* Permissions */}
                        <View className="bg-[#12151F] border border-white/[0.08] rounded-2xl px-5 mb-4">
                            <Text className="text-white text-[15px] font-bold pt-5">Permissions</Text>
                            <Text className="text-slate-500 text-xs mt-1 mb-2">
                                {canEditSettings
                                    ? 'Only admins and the owner can change these'
                                    : 'View only — contact an admin to make changes'}
                            </Text>

                            <SettingRow
                                id="private-group"
                                icon={groupSettings.isPrivateGroup ? 'lock-closed' : 'lock-open'}
                                iconColor={groupSettings.isPrivateGroup ? '#a78bfa' : '#34d399'}
                                title="Private group"
                                subtitle="Only admins can change group details"
                                checked={groupSettings.isPrivateGroup}
                                onToggle={() => onSettingsPress('isPrivateGroup')}
                                disabled={!canEditSettings}
                            />
                            <SettingRow
                                id="allow-member-invite"
                                icon={groupSettings.allowMemberInvite ? 'person-add' : 'person-remove'}
                                iconColor={groupSettings.allowMemberInvite ? '#34d399' : '#f87171'}
                                title="Member invites"
                                subtitle="Let members invite others to the group"
                                checked={groupSettings.allowMemberInvite}
                                onToggle={() => onSettingsPress('allowMemberInvite')}
                                disabled={!canEditSettings}
                            />
                            <SettingRow
                                id="admin-only-messages"
                                icon={
                                    groupSettings.adminOnlyMessages
                                        ? 'chatbubble-ellipses'
                                        : 'chatbubbles'
                                }
                                iconColor={groupSettings.adminOnlyMessages ? '#fb923c' : '#34d399'}
                                title="Admin-only messages"
                                subtitle="Only admins can send messages"
                                checked={groupSettings.adminOnlyMessages}
                                onToggle={() => onSettingsPress('adminOnlyMessages')}
                                disabled={!canEditSettings}
                                isLast
                            />
                        </View>

                        {/* Meta */}
                        <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Ionicons name="information-circle-outline" size={16} color="#818cf8" />
                                <Text className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
                                    Group info
                                </Text>
                            </View>
                            <View className="flex-row justify-between py-2">
                                <Text className="text-slate-500 text-sm">Created by</Text>
                                <Text className="text-slate-200 text-sm font-medium">
                                    {group.createdBy?.name || '—'}
                                </Text>
                            </View>
                            <View className="h-px bg-white/[0.06]" />
                            <View className="flex-row justify-between py-2">
                                <Text className="text-slate-500 text-sm">Your role</Text>
                                <Text className="text-indigo-300 text-sm font-medium">
                                    {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>

                <View
                    className="px-6 pt-3 border-t border-white/[0.06]"
                    style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
                >
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={isUpdatingGroup}
                            activeOpacity={0.8}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] py-[17px] items-center"
                        >
                            <Text className="text-slate-300 font-bold text-[15px]">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleUpdate}
                            disabled={
                                isUpdatingGroup ||
                                !groupName.trim() ||
                                (!canEditBasicInfo && !canEditSettings)
                            }
                            activeOpacity={0.82}
                            className="flex-1 rounded-2xl overflow-hidden"
                        >
                            <LinearGradient
                                colors={
                                    isUpdatingGroup ||
                                    !groupName.trim() ||
                                    (!canEditBasicInfo && !canEditSettings)
                                        ? ['#1e293b', '#1e293b']
                                        : ['#6366f1', '#4f46e5']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 17,
                                    gap: 8,
                                }}
                            >
                                {isUpdatingGroup ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-[15px]">
                                            Save changes
                                        </Text>
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
