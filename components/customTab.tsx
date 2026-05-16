import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { MessageCircleIcon, UsersIcon } from "lucide-react-native";
const { width } = Dimensions.get("window");

export default function CustomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorschema = useColorScheme();
  const isDark = colorschema === "dark";

  const animatedValues = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
  ).current;

  const slideAnim = useRef(new Animated.Value(state.index)).current;
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [state.index]);

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

  const SIDE_MARGIN = 20;
  const TAB_HEIGHT = 62;
  const BOTTOM_OFFSET = 12;
  const containerWidth = width - SIDE_MARGIN * 2;
  const tabCount = state.routes.length;
  const tabWidth = containerWidth / tabCount;
  const pillWidth = tabWidth - 12;

  return (
    // ✅ This outer view reserves space so content isn't hidden behind the tab bar
    <View style={{ height: TAB_HEIGHT + BOTTOM_OFFSET + insets.bottom}}>
      <View
        style={{
          position: "absolute",
          bottom: BOTTOM_OFFSET + insets.bottom,
          left: SIDE_MARGIN,
          right: SIDE_MARGIN,
          height: TAB_HEIGHT,
          borderRadius: 20,
          backgroundColor: isDark ? "#141414" : "#FFFFFF",
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: 0.5,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Sliding active pill */}
        <Animated.View
          style={{
            position: "absolute",
            width: pillWidth,
            height: 46,
            borderRadius: 14,
            backgroundColor: isDark ? "#00008B" : "#2563EB",
            left: 6,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: state.routes.map((_, i) => i),
                  outputRange: state.routes.map((_, i) => i * tabWidth),
                }),
              },
            ],
          }}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const scaleAnim = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1.1],
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

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;

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
                gap: 3,
              }}
              
            >
              {/* ✅ renders your Ionicons from _layout tabBarIcon */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {route.name === "contacts" ? <MessageCircleIcon size={22} color={isFocused ? (isDark ? "#60A5FA" : "#2563EB") : (isDark ? "#A1A1A1" : "#6B7280")} /> : route.name === "groups" ? <UsersIcon size={22} color={isFocused ? (isDark ? "#60A5FA" : "#2563EB") : (isDark ? "#A1A1A1" : "#6B7280")} /> : options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? (isDark ? "#60A5FA" : "#2563EB") : (isDark ? "#A1A1A1" : "#6B7280"),
                  size: 22,
                })}
              </Animated.View>

              <Text
                style={{
                  color: isFocused ? "#ffffff" : "#64748b",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.2,
                }}
              >
                {label === "contacts" ? "Chats" : label === "groups" ? "Groups" : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}