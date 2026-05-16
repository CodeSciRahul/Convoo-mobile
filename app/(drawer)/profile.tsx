import { BottomSheetComponent, BottomSheetRef } from '@/components/ui/bottom-sheet';
import { useUserInfo } from '@/hooks/useAuth';
import { updateUserProfileMultipart } from '@/services/apiServices';
import { storeUserInfo } from '@/util/store';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
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
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words';
    autoCorrect?: boolean;
    editable?: boolean;
    error?: string;
}

function UnderlineField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoCorrect = true,
    editable = true,
    error,
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
            <View className="flex-row items-center pb-3 gap-3">
                <Ionicons
                    name={icon}
                    size={16}
                    color={focused && editable ? '#818cf8' : '#334155'}
                />
                <TextInput
                    className={`flex-1 text-[15px] p-0 m-0 ${editable ? 'text-slate-100' : 'text-slate-500'}`}
                    placeholder={placeholder}
                    placeholderTextColor="#1e293b"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
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
            {error ? <Text className="text-red-400 text-xs mt-2">{error}</Text> : null}
        </View>
    );
}

export default function ProfileScreen() {
    const { data: userInfo } = useUserInfo();
    const [image, setImage] = useState<string | undefined>(undefined);
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const heroAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(100, [
            Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }),
            Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }),
        ]).start();
    }, []);

    const slide = (anim: Animated.Value) => ({
        opacity: anim,
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                }),
            },
        ],
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: { name: '', email: '', mobile: '' },
    });

    useEffect(() => {
        if (userInfo) {
            reset({
                name: userInfo.name || '',
                email: userInfo.email || '',
                mobile: userInfo.mobile || '',
            });
        }
        setImage(userInfo?.profilePic ?? undefined);
    }, [userInfo, reset]);

    const { mutate: updateProfile, isPending } = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await updateUserProfileMultipart(formData);
            return response?.data;
        },
        onSuccess: (data) => {
            Toast.show({ type: 'success', text1: 'Profile updated successfully' });
            storeUserInfo(data.user);
            queryClient.invalidateQueries({ queryKey: ['auth', 'userInfo'] });
        },
    });

    const hasImageChange = image !== (userInfo?.profilePic ?? undefined);
    const hasChanges = isDirty || hasImageChange;

    const onSubmit = (data: { name: string; mobile: string; email: string }) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('mobile', data.mobile);

        if (image && hasImageChange) {
            const fileName = image.split('/').pop() || 'photo.jpg';
            const ext = fileName.split('.').pop()?.toLowerCase();
            const mime =
                ext === 'jpg' || ext === 'jpeg'
                    ? 'image/jpeg'
                    : ext === 'png'
                      ? 'image/png'
                      : 'image/*';
            formData.append('profilePic', {
                uri: image,
                name: fileName,
                type: mime,
            } as unknown as Blob);
        }
        updateProfile(formData);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            mediaTypes: ['images'],
            aspect: [1, 1],
            quality: 0.85,
        });
        bottomSheetRef.current?.dismiss();
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to use this feature.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        bottomSheetRef.current?.dismiss();
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const displayImage = image ?? userInfo?.profilePic;
    const initial = userInfo?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: BG }} edges={['left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                style={{ backgroundColor: BG }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: insets.bottom + 24,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero */}
                    <Animated.View style={slide(heroAnim)} className="items-center pt-4 pb-8">
                        <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-6">
                            Your profile
                        </Text>

                        <View className="relative mb-5">
                            <LinearGradient
                                colors={['#6366f1', '#4f46e5', '#7c3aed']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    padding: 3,
                                }}
                            >
                                <View
                                    className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center"
                                >
                                    {displayImage ? (
                                        <Image
                                            source={{ uri: displayImage }}
                                            style={{ width: 114, height: 114, borderRadius: 57 }}
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={['#4f46e5', '#7c3aed']}
                                            style={{
                                                width: 114,
                                                height: 114,
                                                borderRadius: 57,
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

                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    bottomSheetRef.current?.present();
                                }}
                                activeOpacity={0.85}
                                className="absolute bottom-0 right-0"
                            >
                                <LinearGradient
                                    colors={['#6366f1', '#4f46e5']}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 3,
                                        borderColor: BG,
                                    }}
                                >
                                    <Ionicons name="camera" size={16} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-white text-2xl font-bold tracking-tight">
                            {userInfo?.name || 'User'}
                        </Text>
                        <Text className="text-slate-500 text-sm mt-1">{userInfo?.email}</Text>
                    </Animated.View>

                    {/* Form */}
                    <Animated.View style={slide(formAnim)}>
                        <View className="bg-[#12151F] border border-white/[0.08] rounded-2xl px-5 pt-5 pb-2 mb-5">
                            <Text className="text-white text-[15px] font-bold mb-1">
                                Personal details
                            </Text>
                            <Text className="text-slate-500 text-xs mb-4">
                                Update how others see you on Convoo
                            </Text>

                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: 'Name is required' }}
                                render={({ field: { value, onChange } }) => (
                                    <UnderlineField
                                        label="Display name"
                                        icon="person-outline"
                                        placeholder="Your name"
                                        value={value}
                                        onChangeText={onChange}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                        error={errors.name?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="email"
                                rules={{
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Invalid email format',
                                    },
                                }}
                                render={({ field: { value, onChange } }) => (
                                    <UnderlineField
                                        label="Email address"
                                        icon="mail-outline"
                                        placeholder="you@example.com"
                                        value={value}
                                        onChangeText={onChange}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        error={errors.email?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="mobile"
                                rules={{
                                    pattern: {
                                        value: /^[6-9]\d{9}$/,
                                        message: 'Invalid mobile number',
                                    },
                                }}
                                render={({ field: { value, onChange } }) => (
                                    <UnderlineField
                                        label="Mobile number"
                                        icon="call-outline"
                                        placeholder="10-digit number"
                                        value={value}
                                        onChangeText={onChange}
                                        keyboardType="phone-pad"
                                        autoCapitalize="none"
                                        error={errors.mobile?.message}
                                    />
                                )}
                            />
                        </View>

                        {/* Account info */}
                        <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-6">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Ionicons name="shield-checkmark-outline" size={16} color="#818cf8" />
                                <Text className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
                                    Account
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between py-2">
                                <Text className="text-slate-500 text-sm">Member since</Text>
                                <Text className="text-slate-200 text-sm font-medium">
                                    {formatDate(userInfo?.createdAt)}
                                </Text>
                            </View>
                            <View className="h-px bg-white/[0.06] my-1" />
                            <View className="flex-row items-center justify-between py-2">
                                <Text className="text-slate-500 text-sm">Account ID</Text>
                                <Text
                                    className="text-slate-400 text-xs font-mono"
                                    numberOfLines={1}
                                >
                                    {userInfo?._id?.slice(-8) ?? '—'}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        {hasChanges && (
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        reset();
                                        setImage(userInfo?.profilePic ?? undefined);
                                    }}
                                    disabled={isPending}
                                    activeOpacity={0.8}
                                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] py-[17px] items-center"
                                >
                                    <Text className="text-slate-300 font-bold text-[15px]">
                                        Discard
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={isPending}
                                    activeOpacity={0.82}
                                    className="flex-1 rounded-2xl overflow-hidden"
                                >
                                    <View
                                        className={`flex-row items-center justify-center py-[17px] gap-2 ${
                                            isPending ? 'bg-indigo-800' : 'bg-indigo-600'
                                        }`}
                                    >
                                        {isPending ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text className="text-white font-bold text-[15px]">
                                                    Save changes
                                                </Text>
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>

                <BottomSheetComponent 
                ref={bottomSheetRef} 
                snapPoints={['42%']}
                >
                    <View className="px-6 pb-6 bg-[#111827]">
                        <View className="items-center mb-6">
                            <Text className="text-white text-lg font-bold">Change photo</Text>
                            <Text className="text-slate-500 text-sm mt-1 text-center">
                                Take a new photo or choose from your gallery
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    openCamera();
                                }}
                                activeOpacity={0.85}
                                className="flex-1 rounded-2xl overflow-hidden"
                            >
                                <LinearGradient
                                    colors={['#4f46e5', '#6366f1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 20, alignItems: 'center' }}
                                >
                                    <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-3">
                                        <Ionicons name="camera-outline" size={28} color="#fff" />
                                    </View>
                                    <Text className="text-white font-bold text-base">Camera</Text>
                                    <Text className="text-indigo-200/70 text-xs mt-1">
                                        Take a photo
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    pickImage();
                                }}
                                activeOpacity={0.85}
                                className="flex-1 rounded-2xl overflow-hidden"
                            >
                                <LinearGradient
                                    colors={['#7c3aed', '#6366f1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 20, alignItems: 'center' }}
                                >
                                    <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-3">
                                        <Ionicons name="images-outline" size={28} color="#fff" />
                                    </View>
                                    <Text className="text-white font-bold text-base">Gallery</Text>
                                    <Text className="text-indigo-200/70 text-xs mt-1">
                                        Choose existing
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BottomSheetComponent>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
