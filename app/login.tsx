import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signin } from "../services/apiServices";
import { storeAuthData } from "../util/store";

// ── Underline Input Field ──────────────────────────────────────────────────
interface FieldProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "sentences";
    autoCorrect?: boolean;
    rightElement?: React.ReactNode;
}

function UnderlineField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = "default",
    autoCapitalize = "sentences",
    autoCorrect = true,
    rightElement,
}: FieldProps) {
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
        outputRange: ["0%", "100%"],
    });

    return (
        <View className="mb-7">
            {/* Label */}
            <Text
                className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${
                    focused ? "text-indigo-400" : "text-slate-500"
                }`}
            >
                {label}
            </Text>

            {/* Row */}
            <View className="flex-row items-center pb-3 gap-3">
                <Ionicons
                    name={icon}
                    size={16}
                    color={focused ? "#818cf8" : "#334155"}
                />
                <TextInput
                    className="flex-1 text-[15px] text-slate-100 p-0 m-0"
                    placeholder={placeholder}
                    placeholderTextColor="#1e293b"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                {rightElement}
            </View>

            {/* Base underline */}
            <View className="h-px bg-white/[0.07]" />

            {/* Animated active underline */}
            <Animated.View
                style={{ width: lineWidth }}
                className="h-px bg-indigo-500 absolute bottom-0 left-0"
            />
        </View>
    );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const topAnim  = useRef(new Animated.Value(0)).current;
    const heroAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(110, [
            Animated.spring(topAnim,  { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }),
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
                    outputRange: [26, 0],
                }),
            },
        ],
    });

    const { mutate: signinMutation, isPending: isLoading } = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) =>
            await signin(email, password),
        onSuccess: async (response) => {
            await storeAuthData(response.data.token, response.data.user);
            router.replace("/(drawer)/(tab)/contacts");
        },
        onError: (error: any) => {
            Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong");
        },
    });

    const handleLogin = () => {
        if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
        if (!email.includes("@")) return Alert.alert("Error", "Please enter a valid email");
        signinMutation({ email, password });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#07090F]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-7">

                        {/* ── Top bar ── */}
                        <Animated.View
                            style={slide(topAnim)}
                            className="flex-row items-center justify-between pt-7"
                        >
                            {/* Logo */}
                            <View className="flex-row items-center gap-2">
                                <View className="w-9 h-9 rounded-[10px] bg-indigo-600 items-center justify-center">
                                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                                </View>
                                <Text className="text-white text-[17px] font-bold tracking-tight">
                                    Convoo
                                </Text>
                            </View>

                            {/* Secure badge */}
                            <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-[5px]">
                                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <Text className="text-emerald-300 text-[10px] font-semibold tracking-[2px]">
                                    SECURE
                                </Text>
                            </View>
                        </Animated.View>

                        {/* ── Hero ── */}
                        <Animated.View style={slide(heroAnim)} className="pt-10 pb-9">
                            <Text className="text-indigo-400 text-[11px] font-semibold tracking-[2.5px] uppercase mb-3">
                                Welcome back
                            </Text>
                            <Text className="text-white text-[36px] font-bold leading-tight tracking-tight mb-3">
                                Sign in to{"\n"}
                                <Text className="text-indigo-400">your account</Text>
                            </Text>
                            <Text className="text-slate-500 text-[14px] leading-relaxed">
                                Pick up right where you left off
                            </Text>
                        </Animated.View>

                        {/* ── Form ── */}
                        <Animated.View style={slide(formAnim)}>

                            <UnderlineField
                                label="Email address"
                                icon="mail-outline"
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <UnderlineField
                                label="Password"
                                icon="lock-closed-outline"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                rightElement={
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={18}
                                            color="#475569"
                                        />
                                    </TouchableOpacity>
                                }
                            />

                            {/* Forgot password */}
                            <TouchableOpacity
                                className="self-end -mt-2 mb-9"
                                activeOpacity={0.7}
                            >
                                <Text className="text-indigo-400 text-[12.5px] font-semibold">
                                    Forgot password?
                                </Text>
                            </TouchableOpacity>

                            {/* Sign In button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.82}
                                className="rounded-2xl overflow-hidden mb-10"
                            >
                                <View
                                    className={`flex-row items-center justify-between px-6 py-[17px] ${
                                        isLoading ? "bg-indigo-800" : "bg-indigo-600"
                                    }`}
                                >
                                    <Text className="text-white text-[15px] font-bold tracking-wide">
                                        {isLoading ? "Signing In…" : "Sign In"}
                                    </Text>
                                    {!isLoading && (
                                        <View className="w-9 h-9 rounded-[10px] bg-white/20 items-center justify-center">
                                            <Ionicons name="arrow-forward" size={15} color="#fff" />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Sign up link */}
                            <View className="flex-row items-center justify-center pb-8">
                                <Text className="text-slate-500 text-[13px]">New here? </Text>
                                <TouchableOpacity
                                    onPress={() => router.push("/signup")}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-indigo-400 text-[13px] font-bold">
                                        Create an account
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}