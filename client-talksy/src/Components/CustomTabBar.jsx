import React, { useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Platform, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../hooks/chat/useThemeColors";
import { spacing, radius, shadows, timing } from "../theme/designTokens";

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { bg, textPrimary, textTertiary, accent, myBubble, tabBarBg, tabInactive, isDark } = useThemeColors();

    const renderTab = (route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
            const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
            }
        };

        const getIconName = (name) => {
            switch (name) {
                case "Home": return isFocused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
                case "Calls": return isFocused ? "call" : "call-outline";
                case "Status": return isFocused ? "aperture" : "aperture-outline";
                case "Settings": return isFocused ? "settings" : "settings-outline";
                default: return "help";
            }
        };

        return (
            <TouchableOpacity
                key={index}
                onPress={onPress}
                style={s.tabItem}
                activeOpacity={0.6}
            >
                <Ionicons
                    name={getIconName(route.name)}
                    size={24}
                    color={isFocused ? accent : tabInactive}
                />
                <Text style={[s.tabLabel, { color: isFocused ? accent : tabInactive }]}>
                    {route.name === "Home" ? "Chats" : route.name}
                </Text>
                {isFocused && (
                    <Animated.View style={[s.indicator, { backgroundColor: accent }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.container}>
            {/* FAB */}
            <TouchableOpacity
                style={[s.fab, { backgroundColor: accent, ...shadows.copper }]}
                activeOpacity={0.8}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate("NewChat");
                }}
            >
                <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
            </TouchableOpacity>

            {/* Tab Bar */}
            <View style={[s.tabBar, { backgroundColor: tabBarBg, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(196,115,74,0.08)" }]}>
                {state.routes.map((route, index) => renderTab(route, index))}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBar: {
        flexDirection: "row",
        height: Platform.OS === "ios" ? 88 : 72,
        paddingBottom: Platform.OS === "ios" ? 28 : 12,
        borderTopWidth: 0.5,
        justifyContent: "space-around",
        alignItems: "center",
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
    indicator: {
        position: "absolute",
        top: -12,
        width: 18,
        height: 3,
        borderRadius: 2,
    },
    fab: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 100 : 88,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
    },
});

export default CustomTabBar;
