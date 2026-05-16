import Member from '@/components/member';
import { Switch } from '@/components/ui/switch';
import { createGroup, getReceivers } from '@/services/apiServices';
import { Receiver, ReceiversResponse } from '@/types';
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
}

function UnderlineField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    multiline,
}: UnderlineFieldProps) {
    const [focused, setFocused] = useState(false);
    const lineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(lineAnim, {
            toValue: focused ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [focused]);

    const lineWidth = lineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View className="mb-6">
            <Text
                className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${
                    focused ? 'text-indigo-400' : 'text-slate-500'
                }`}
            >
                {label}
            </Text>
            <View className={`flex-row gap-3 pb-3 ${multiline ? 'items-start' : 'items-center'}`}>
                <Ionicons
                    name={icon}
                    size={16}
                    color={focused ? '#818cf8' : '#334155'}
                    style={multiline ? { marginTop: 4 } : undefined}
                />
                <TextInput
                    className={`flex-1 text-[15px] text-slate-100 p-0 m-0 ${multiline ? 'min-h-[72px]' : ''}`}
                    placeholder={placeholder}
                    placeholderTextColor="#1e293b"
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    numberOfLines={multiline ? 3 : 1}
                    textAlignVertical={multiline ? 'top' : 'center'}
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
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    subtitle: string;
    checked: boolean;
    onToggle: () => void;
    id: string;
    isLast?: boolean;
}) {
    return (
        <View
            className={`flex-row items-center justify-between py-4 ${
                !isLast ? 'border-b border-white/[0.06]' : ''
            }`}
        >
            <TouchableOpacity
                className="flex-row items-center flex-1 mr-3"
                onPress={onToggle}
                activeOpacity={0.8}
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
            />
        </View>
    );
}

export default function CreateGroupScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(1);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);

    const contentAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(contentAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, [currentStep]);

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

    const { data: receivers, isLoading } = useQuery<ReceiversResponse>({
        queryKey: ['receivers'],
        queryFn: async () => {
            const response = await getReceivers();
            return response.data as ReceiversResponse;
        },
    });

    const [groupSettings, setGroupSettings] = useState({
        isPrivateGroup: false,
        allowMemberInvite: false,
        adminOnlyMessages: false,
    });

    const { mutate: createGroupMutation, isPending: isCreatingGroup } = useMutation({
        mutationFn: async (payload: {
            name: string;
            description: string;
            settings: typeof groupSettings;
            memberEmails: string[];
        }) => {
            const response = await createGroup(payload);
            return response.data;
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Group created successfully' });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            router.back();
        },
        onError: (error) => {
            Toast.show({
                type: 'error',
                text1:
                    (error as AxiosError<{ message: string }>)?.response?.data?.message ||
                    'Failed to create group',
            });
        },
    });

    function onSettingsPress(key: keyof typeof groupSettings) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleNextStep() {
        if (!groupName.trim()) {
            Toast.show({ type: 'error', text1: 'Group name is required' });
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        contentAnim.setValue(0);
        setCurrentStep(2);
    }

    function handleBackStep() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        contentAnim.setValue(0);
        setCurrentStep(1);
    }

    function handleCreateGroup() {
        if (selectedReceivers.length === 0) {
            Toast.show({ type: 'error', text1: 'Please select at least one member' });
            return;
        }
        createGroupMutation({
            name: groupName,
            description: groupDescription,
            settings: groupSettings,
            memberEmails: selectedReceivers,
        });
    }

    function renderProgressIndicator() {
        return (
            <View className="px-6 pt-2 pb-5">
                <View className="flex-row items-center">
                    <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${
                            currentStep >= 1 ? 'bg-indigo-600' : 'bg-white/[0.08]'
                        }`}
                    >
                        {currentStep > 1 ? (
                            <Ionicons name="checkmark" size={18} color="#fff" />
                        ) : (
                            <Text
                                className={`text-sm font-bold ${
                                    currentStep >= 1 ? 'text-white' : 'text-slate-500'
                                }`}
                            >
                                1
                            </Text>
                        )}
                    </View>
                    <View
                        className={`flex-1 h-0.5 mx-3 rounded-full ${
                            currentStep >= 2 ? 'bg-indigo-500' : 'bg-white/[0.08]'
                        }`}
                    />
                    <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${
                            currentStep >= 2 ? 'bg-indigo-600' : 'bg-white/[0.08]'
                        }`}
                    >
                        <Text
                            className={`text-sm font-bold ${
                                currentStep >= 2 ? 'text-white' : 'text-slate-500'
                            }`}
                        >
                            2
                        </Text>
                    </View>
                </View>
                <View className="flex-row justify-between mt-2.5 px-0.5">
                    <Text
                        className={`text-[11px] font-semibold ${
                            currentStep >= 1 ? 'text-indigo-400' : 'text-slate-600'
                        }`}
                    >
                        Group info
                    </Text>
                    <Text
                        className={`text-[11px] font-semibold ${
                            currentStep >= 2 ? 'text-indigo-400' : 'text-slate-600'
                        }`}
                    >
                        Add members
                    </Text>
                </View>
            </View>
        );
    }

    function renderStep1() {
        return (
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            >
                <Animated.View style={slide}>
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 items-center justify-center mb-4">
                            <Ionicons name="people" size={32} color="#818cf8" />
                        </View>
                        <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-2">
                            New group
                        </Text>
                        <Text className="text-white text-2xl font-bold tracking-tight text-center">
                            Set up your group
                        </Text>
                        <Text className="text-slate-500 text-sm text-center mt-2 leading-relaxed px-4">
                            Name your group and choose how members can interact
                        </Text>
                    </View>

                    <View className="bg-[#12151F] border border-white/[0.08] rounded-2xl px-5 pt-5 pb-2 mb-5">
                        <Text className="text-white text-[15px] font-bold mb-4">Basic info</Text>

                        <UnderlineField
                            label="Group name"
                            icon="chatbubbles-outline"
                            placeholder="e.g. Project Team"
                            value={groupName}
                            onChangeText={setGroupName}
                        />

                        <UnderlineField
                            label="Description"
                            icon="document-text-outline"
                            placeholder="What's this group about? (optional)"
                            value={groupDescription}
                            onChangeText={setGroupDescription}
                            multiline
                        />
                    </View>

                    <View className="bg-[#12151F] border border-white/[0.08] rounded-2xl px-5 mb-2">
                        <Text className="text-white text-[15px] font-bold pt-5 pb-1">Permissions</Text>
                        <Text className="text-slate-500 text-xs mb-2">
                            You can change these later in group settings
                        </Text>

                        <SettingRow
                            id="private-group"
                            icon={groupSettings.isPrivateGroup ? 'lock-closed' : 'lock-open'}
                            iconColor={groupSettings.isPrivateGroup ? '#a78bfa' : '#34d399'}
                            title="Private group"
                            subtitle="Only admins can change group details"
                            checked={groupSettings.isPrivateGroup}
                            onToggle={() => onSettingsPress('isPrivateGroup')}
                        />
                        <SettingRow
                            id="allow-member-invite"
                            icon={groupSettings.allowMemberInvite ? 'person-add' : 'person-remove'}
                            iconColor={groupSettings.allowMemberInvite ? '#34d399' : '#f87171'}
                            title="Member invites"
                            subtitle="Let members invite others to the group"
                            checked={groupSettings.allowMemberInvite}
                            onToggle={() => onSettingsPress('allowMemberInvite')}
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
                            isLast
                        />
                    </View>
                </Animated.View>
            </ScrollView>
        );
    }

    function renderStep2() {
        return (
            <Animated.View style={[{ flex: 1 }, slide]}>
                <View className="px-6 pb-4">
                    <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-2">
                        Step 2
                    </Text>
                    <Text className="text-white text-2xl font-bold tracking-tight">Add members</Text>
                    <Text className="text-slate-500 text-sm mt-1">
                        Select contacts to add to {groupName || 'your group'}
                    </Text>

                    {selectedReceivers.length > 0 && (
                        <View className="mt-4 flex-row items-center bg-indigo-500/15 border border-indigo-500/25 rounded-xl px-4 py-2.5">
                            <Ionicons name="checkmark-circle" size={18} color="#818cf8" />
                            <Text className="ml-2 text-sm font-semibold text-indigo-300">
                                {selectedReceivers.length}{' '}
                                {selectedReceivers.length === 1 ? 'member' : 'members'} selected
                            </Text>
                        </View>
                    )}
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="mt-4 text-slate-500 text-sm">Loading contacts…</Text>
                    </View>
                ) : (
                    <FlatList
                        data={receivers?.receivers || []}
                        renderItem={({ item }: { item: Receiver }) => (
                            <View className="mb-2 px-6">
                                <Member
                                    handleSelectedReceiver={(email, isSelected) => {
                                        setSelectedReceivers((prev) => {
                                            if (isSelected) {
                                                if (!prev.includes(email)) {
                                                    Haptics.impactAsync(
                                                        Haptics.ImpactFeedbackStyle.Light
                                                    );
                                                    return [...prev, email];
                                                }
                                            } else {
                                                Haptics.impactAsync(
                                                    Haptics.ImpactFeedbackStyle.Light
                                                );
                                                return prev.filter((e) => e !== email);
                                            }
                                            return prev;
                                        });
                                    }}
                                    receiver={item}
                                />
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ paddingBottom: 16 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-16 px-8">
                                <View className="w-16 h-16 rounded-2xl bg-white/[0.06] items-center justify-center mb-4">
                                    <Ionicons name="people-outline" size={32} color="#475569" />
                                </View>
                                <Text className="text-white text-lg font-bold">No contacts yet</Text>
                                <Text className="text-slate-500 text-sm text-center mt-2">
                                    Add contacts first, then come back to invite them to your group
                                </Text>
                            </View>
                        }
                    />
                )}
            </Animated.View>
        );
    }

    return (
        <SafeAreaView 
        className="flex-1" style={{ backgroundColor: BG }} 
        edges={['bottom', 'left', 'right']}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                style={{ backgroundColor: BG }}
            >
                {renderProgressIndicator()}
                {currentStep === 1 ? renderStep1() : renderStep2()}


                <View
                    className="px-6 pt-3 border-t border-white/[0.06]"
                    style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
                >
                    <View className="flex-row gap-3">
                        {currentStep === 2 && (
                            <TouchableOpacity
                                onPress={handleBackStep}
                                disabled={isCreatingGroup}
                                activeOpacity={0.8}
                                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] py-[17px] items-center"
                            >
                                <Text className="text-slate-300 font-bold text-[15px]">Back</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={currentStep === 1 ? handleNextStep : handleCreateGroup}
                            disabled={
                                isCreatingGroup ||
                                (currentStep === 2 && selectedReceivers.length === 0)
                            }
                            activeOpacity={0.82}
                            className="flex-1 rounded-2xl overflow-hidden"
                        >
                            <LinearGradient
                                colors={
                                    isCreatingGroup ||
                                    (currentStep === 2 && selectedReceivers.length === 0)
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
                                {isCreatingGroup ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-[15px]">
                                            {currentStep === 1 ? 'Continue' : 'Create group'}
                                        </Text>
                                        <Ionicons
                                            name={
                                                currentStep === 1 ? 'arrow-forward' : 'checkmark'
                                            }
                                            size={18}
                                            color="#fff"
                                        />
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
