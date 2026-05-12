import React, { useState, useRef, useContext, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions,
    Modal, Pressable, StatusBar, Image, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const COPPER = "#C4734A";

export default function Settings({ navigation, setIsLoggedIn }) {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const [user, setUser] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const sheetAnim = useRef(new Animated.Value(0)).current;
    const curtainAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
    const [curtainColor, setCurtainColor] = useState("#2B1F1A");

    useEffect(() => {
        const loadUser = async () => {
            const userStr = await AsyncStorage.getItem("user");
            if (userStr) setUser(JSON.parse(userStr));
        };
        const unsubscribe = navigation.addListener('focus', loadUser);
        return unsubscribe;
    }, [navigation]);

    // Dynamic Colors
    const bg = isDark ? "#121212" : "#F7ECE9";
    const surface = isDark ? "#1C1C1E" : "#FFFFFF";
    const textMain = isDark ? "#FFFFFF" : "#2B1F1A";
    const textSub = isDark ? "#A1A1A6" : "#8E5A55";

    const openModal = () => {
        setModalVisible(true);
        Animated.timing(sheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };

    const closeModal = () => {
        Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setModalVisible(false);
        });
    };

    const handleThemeChange = (mode) => {
        closeModal();
        if ((mode === "dark" && isDark) || (mode === "light" && !isDark)) return;

        setCurtainColor(mode === "dark" ? "#121212" : "#F7ECE9");

        curtainAnim.setValue(-SCREEN_HEIGHT);
        Animated.timing(curtainAnim, {
            toValue: 0, duration: 350, useNativeDriver: true
        }).start(() => {
            toggleTheme(mode);
            Animated.timing(curtainAnim, {
                toValue: SCREEN_HEIGHT, duration: 350, useNativeDriver: true
            }).start();
        });
    };

    const SettingItem = ({ icon, title, sub, onPress, noChevron }) => (
        <TouchableOpacity style={s.itemRow} onPress={onPress} activeOpacity={0.7}>
            <View style={s.iconWrap}>
                <Ionicons name={icon} size={22} color={textMain} />
            </View>
            <View style={s.itemTextWrap}>
                <Text style={[s.itemTitle, { color: textMain }]}>{title}</Text>
                {sub && <Text style={[s.itemSub, { color: textSub }]}>{sub}</Text>}
            </View>
            {!noChevron && <Ionicons name="chevron-forward" size={20} color={textSub} />}
        </TouchableOpacity>
    );

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />

            {/* Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <Text style={[s.headerTitle, { color: textMain }]}>Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Profile Section */}
                <View style={s.profileSection}>
                    <View style={s.avatarWrap}>
                        <View style={[s.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}>
                            {user?.profilePic ? (
                                <Image source={{ uri: user.profilePic }} style={{ width: "100%", height: "100%", borderRadius: 45 }} />
                            ) : (
                                <Text style={[s.avatarTxt, { color: isDark ? "#fff" : "#C4734A" }]}>{user?.username?.charAt(0)?.toUpperCase() || "K"}</Text>
                            )}
                        </View>
                    </View>
                    <View style={s.profileInfo}>
                        <Text style={[s.profileName, { color: textMain }]}>{user?.name || user?.username || "Klyro User"}</Text>
                        <Text style={[s.profileStatus, { color: textSub }]}>@{user?.username || "username"}</Text>
                    </View>
                    <TouchableOpacity
                        style={[s.editProfileBtn, { backgroundColor: COPPER }]}
                        onPress={() => navigation.navigate("Profile")}
                        activeOpacity={0.8}
                    >
                        <Text style={s.editProfileTxt}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={[s.divider, { backgroundColor: isDark ? "#2A2A2D" : "#F1D7D1" }]} />

                {/* Settings List */}
                <View style={s.settingsList}>
                    <SettingItem icon="settings-outline" title="Settings" />
                    <SettingItem icon="color-palette-outline" title="Appearance" onPress={openModal} />
                    <SettingItem icon="lock-closed-outline" title="Change Password" onPress={() => {
                        const userMobile = user?.mobile || "";
                        navigation.navigate("VerifyOTP", { mobile: userMobile, flow: "settings" });
                    }} />

                    <View style={[s.divider, { backgroundColor: isDark ? "#2A2A2D" : "#F1D7D1", marginVertical: 10 }]} />

                    <SettingItem icon="help-circle-outline" title="Help & Support" />

                    {/* Logout */}
                    <TouchableOpacity
                        style={[s.itemRow, { marginTop: 10 }]}
                        onPress={async () => {
                            await AsyncStorage.removeItem("user");
                            if (typeof setIsLoggedIn === 'function') setIsLoggedIn(false);
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={s.iconWrap}>
                            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
                        </View>
                        <View style={s.itemTextWrap}>
                            <Text style={[s.itemTitle, { color: "#e74c3c", fontWeight: "600" }]}>Log out</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Appearance Bottom Sheet Modal */}
            <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBackdrop, { opacity: sheetAnim }]} />
                    <Pressable style={{ flex: 1 }} onPress={closeModal} />
                    <Animated.View style={[s.bottomSheet, {
                        backgroundColor: surface,
                        transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }]
                    }]}>
                        <View style={s.sheetHandle} />
                        <Text style={[s.sheetTitle, { color: textMain }]}>Choose theme</Text>

                        <TouchableOpacity style={s.radioRow} onPress={() => handleThemeChange("light")} activeOpacity={0.7}>
                            <View style={[s.radioOuter, !isDark && s.radioOuterActive]}>
                                {!isDark && <View style={s.radioInner} />}
                            </View>
                            <Text style={[s.radioText, { color: textMain }]}>Light Mode</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={s.radioRow} onPress={() => handleThemeChange("dark")} activeOpacity={0.7}>
                            <View style={[s.radioOuter, isDark && s.radioOuterActive]}>
                                {isDark && <View style={s.radioInner} />}
                            </View>
                            <Text style={[s.radioText, { color: textMain }]}>Dark Mode</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Curtain Animation */}
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, {
                    backgroundColor: curtainColor,
                    zIndex: 9999,
                    transform: [{ translateY: curtainAnim }]
                }]}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 28, fontWeight: "800" },

    profileSection: { alignItems: "center", paddingTop: 10, paddingBottom: 30 },
    avatarWrap: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 1, borderColor: "#ccc",
        justifyContent: "center", alignItems: "center",
        marginBottom: 12, overflow: "hidden"
    },
    avatar: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
    avatarTxt: { fontSize: 36, fontWeight: "700" },
    profileInfo: { alignItems: "center", marginBottom: 20 },
    profileName: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
    profileStatus: { fontSize: 14 },
    editProfileBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
    editProfileTxt: { color: "#fff", fontSize: 14, fontWeight: "500" },

    divider: { height: 1, width: "90%", alignSelf: "center", marginVertical: 10 },

    settingsList: { paddingHorizontal: 10 },
    itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
    iconWrap: { width: 32, alignItems: "flex-start", marginRight: 10 },
    itemTextWrap: { flex: 1 },
    itemTitle: { fontSize: 15, fontWeight: "500" },
    itemSub: { fontSize: 13, marginTop: 2 },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    bottomSheet: {
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc",
        alignSelf: "center", marginBottom: 20,
    },
    sheetTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
    radioRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 16 },
    radioOuter: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#777",
        justifyContent: "center", alignItems: "center",
    },
    radioOuterActive: { borderColor: COPPER },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COPPER },
    radioText: { fontSize: 16, fontWeight: "500" },
});
