import React, { useRef, useContext } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const PURPLE = "#5B5FC7";

export default function CustomTabBar({ state, descriptors, navigation }) {
    const { isDark } = useContext(ThemeContext);

    const bg = isDark ? "#111b21" : "#fff";
    const border = isDark ? "#202c33" : "#f0f0f0";
    const textSub = isDark ? "#8696a0" : "#667781";

    // FAB animation
    const fabScale = useRef(new Animated.Value(1)).current;

    const tabs = [
        { name: "HomeTab", label: "Chats", iconActive: "chatbubbles", iconInactive: "chatbubbles-outline" },
        { name: "SettingsTab", label: "Profile", iconActive: "person", iconInactive: "person-outline" },
    ];

    return (
        <View style={s.wrapper}>
            {/* ─── Floating Container ─── */}
            <View style={[s.tabBarContainer, { backgroundColor: bg }]}>
                {/* Center Bump */}
                <View style={[s.centerBump, { backgroundColor: bg }]} />

                {/* ─── Bottom Tab Bar ─── */}
                <View style={s.tabBarInner}>
                    {tabs.map((tab, index) => {
                        const isFocused = state.index === index;
                        const iconName = isFocused ? tab.iconActive : tab.iconInactive;
                        const color = isFocused ? PURPLE : textSub;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: state.routes[index].key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(state.routes[index].name);
                            }
                        };

                        return (
                            <React.Fragment key={tab.name}>
                                <TouchableOpacity style={s.navItem} onPress={onPress} activeOpacity={0.7}>
                                    <View style={s.navIconWrap}>
                                        <Ionicons name={iconName} size={28} color={color} />
                                    </View>
                                    <Text style={[s.navLabel, { color, fontWeight: isFocused ? "700" : "500" }]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                                {index === 0 && <View style={s.spacer} />}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>

            {/* ─── Floating Purple FAB ─── */}
            <Animated.View style={[s.fabWrap, { transform: [{ scale: fabScale }] }]}>
                <TouchableOpacity
                    style={s.fab}
                    activeOpacity={0.85}
                    onPress={() => {
                        navigation.navigate("NewChat");
                    }}
                >
                    <Ionicons name="add" size={36} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 30 : 20,
        left: 20,
        right: 20,
        // Removed Android elevation from transparent wrapper to fix the ugly rectangular shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
    },
    tabBarContainer: {
        width: "100%",
        height: 74,
        borderRadius: 37,
    },
    centerBump: {
        position: "absolute",
        top: -26,
        left: "50%",
        marginLeft: -38, // 76 / 2
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    tabBarInner: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    navItem: {
        padding: 6,
        alignItems: "center",
        minWidth: 80,
    },
    spacer: {
        width: 100, // Space for the center FAB
    },
    navLabel: { fontSize: 12, marginTop: 4, fontWeight: "500" },
    navIconWrap: {
        justifyContent: "center", alignItems: "center",
    },

    // Floating Action Button
    fabWrap: {
        position: "absolute",
        top: -17, // Centers the 60px FAB inside the 76px bump (bump top -26, center is 12. 12 - 30 = -18)
        left: "50%",
        marginLeft: -30,
        zIndex: 10,
        elevation: 12,
    },
    fab: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: PURPLE,
        justifyContent: "center", alignItems: "center",
        shadowColor: "#5B5FC7",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
});
