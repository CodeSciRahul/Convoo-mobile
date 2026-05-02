import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const { width } = Dimensions.get("window");

export default function CustomTab({ state, descriptors, navigation }: BottomTabBarProps) {
    const animatedValues = useRef(
        state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
    ).current;

    const slideAnim = useRef(new Animated.Value(0)).current;

    // Animate the active indicator slide
    useEffect(() => {
        const tabWidth = 1 / state.routes.length;
        Animated.spring(slideAnim, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
        }).start();
    }, [state.index]);

    // Animate scale for each tab icon
    useEffect(() => {
        animatedValues.forEach((anim, i) => {
            Animated.spring(anim, {
                toValue: i === state.index ? 1 : 0,
                useNativeDriver: true,
                tension: 80,
                friction: 8,
            }).start();
        });
    }, [state.index]);

    const tabIcons: Record<string, string> = {
        Home: "⌂",
        Search: "⌕",
        Profile: "◉",
        Settings: "⚙",
        Notifications: "◎",
        Messages: "✉",
        Explore: "⊕",
        Favorites: "♡",
    };

    const containerWidth = width - 48; // 24px margin each side
    const tabWidth = containerWidth / state.routes.length;

    return (
        <View
            style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                right: 24,
                height: 68,
                borderRadius: 34,
                backgroundColor: "#0f172a",
                flexDirection: "row",
                alignItems: "center",
                overflow: "hidden",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 16,
                borderWidth: 1,
                borderColor: "rgba(59,130,246,0.2)",
            }}
        >
            {/* Sliding active pill */}
            <Animated.View
                style={{
                    position: "absolute",
                    width: tabWidth - 12,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#3b82f6",
                    left: 6,
                    transform: [
                        {
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, containerWidth - 12],
                            }),
                        },
                    ],
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 8,
                }}
            />

            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { options } = descriptors[route.key];

                const scaleAnim = animatedValues[index];

                const iconScale = scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1.15],
                });

                const textOpacity = scaleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                });

                const textWidth = scaleAnim.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 48],
                });

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const icon = options.tabBarIcon
                    ? null
                    : tabIcons[route.name] ?? "•";

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        activeOpacity={0.8}
                        style={{
                            flex: 1,
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 4,
                        }}
                    >
                        {/* Icon */}
                        <Animated.Text
                            style={{
                                fontSize: 20,
                                transform: [{ scale: iconScale }],
                                color: isFocused ? "#ffffff" : "#94a3b8",
                            }}
                        >
                            {options.tabBarIcon
                                ? null
                                : icon}
                        </Animated.Text>

                        {/* Label — slides in when active */}
                        <Animated.View
                            style={{
                                overflow: "hidden",
                                width: textWidth,
                                opacity: textOpacity,
                            }}
                        >
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: "#ffffff",
                                    fontSize: 12,
                                    fontWeight: "700",
                                    letterSpacing: 0.3,
                                }}
                            >
                                {options.tabBarLabel?.toString() ?? route.name}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
