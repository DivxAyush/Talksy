import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { useThemeColors } from "../hooks/chat/useThemeColors";
import { spacing, radius, typography, shadows, iconSize, avatarSize } from "../theme/designTokens";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";

const SettingsItem = React.memo(({ icon, label, subLabel, value, onValueChange, onPress, isSwitch, isLast, color, iconBg, textPrimary, textSecondary, border, accent }) => (
    <TouchableOpacity
        style={[s.item, !isLast && { borderBottomWidth: 0.5, borderBottomColor: border }]}
        onPress={onPress}
        disabled={isSwitch}
        activeOpacity={0.6}
    >
        <View style={[s.iconBg, { backgroundColor: iconBg || "rgba(196,115,74,0.08)" }]}>
            <Ionicons name={icon} size={20} color={color || textPrimary} />
        </View>
        <View style={s.itemContent}>
            <Text style={[s.itemLabel, { color: textPrimary }]}>{label}</Text>
            {subLabel && <Text style={[s.itemSubLabel, { color: textSecondary }]}>{subLabel}</Text>}
        </View>
        {isSwitch ? (
            <Switch
                value={value}
                onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onValueChange(v);
                }}
                trackColor={{ false: "#767577", true: "#C4734A" }}
                thumbColor={Platform.OS === "ios" ? "#fff" : value ? "#fff" : "#f4f3f4"}
            />
        ) : (
            <Ionicons name="chevron-forward" size={18} color={textSecondary} />
        )}
    </TouchableOpacity>
));

export default function Settings({ navigation, setIsLoggedIn }) {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const [user, setUser] = React.useState(null);
    const [showQR, setShowQR] = React.useState(false);

    React.useEffect(() => {
        const loadUser = async () => {
            const userStr = await AsyncStorage.getItem("user");
            if (userStr) setUser(JSON.parse(userStr));
        };
        const unsubscribe = navigation.addListener('focus', loadUser);
        loadUser();
        return unsubscribe;
    }, [navigation]);

    const colors = useThemeColors();
    const { bg, surface, textPrimary, textSecondary, border, accent, danger } = colors;

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await AsyncStorage.multiRemove(["token", "userId", "username"]);
        setIsLoggedIn(false);
    };

    return (
        <ScrollView style={[s.container, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={s.header}>
                <Text style={[s.headerTitle, { color: textPrimary }]}>Settings</Text>
            </View>

            {/* Profile Section */}
            <TouchableOpacity 
                style={[s.profileCard, { backgroundColor: surface }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("Profile")}
            >
                <View style={[s.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}>
                    {user?.profilePic ? (
                        <Image source={{ uri: user.profilePic }} style={s.avatarImg} />
                    ) : (
                        <Text style={[s.avatarTxt, { color: isDark ? "#fff" : "#C4734A" }]}>{user?.username?.charAt(0)?.toUpperCase()}</Text>
                    )}
                </View>
                <View style={s.profileInfo}>
                    <Text style={[s.profileName, { color: textPrimary }]}>{user?.name || user?.username}</Text>
                    <Text style={[s.profileAbout, { color: textSecondary }]} numberOfLines={1}>
                        {user?.about || "Available"}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowQR(true)} style={{ padding: 8 }}>
                    <Ionicons name="qr-code-outline" size={24} color={accent} />
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Settings Sections */}
            <View style={s.section}>
                <Text style={[s.sectionTitle, { color: accent }]}>App Settings</Text>
                <View style={[s.sectionCard, { backgroundColor: surface }]}>
                    <SettingsItem
                        icon="moon-outline"
                        label="Dark Mode"
                        subLabel="Reduce eyestrain at night"
                        isSwitch
                        value={isDark}
                        onValueChange={toggleTheme}
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(196,115,74,0.12)"
                        color={accent}
                    />
                    <SettingsItem
                        icon="notifications-outline"
                        label="Notifications"
                        subLabel="Alerts, sounds, vibrations"
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(216,191,106,0.12)"
                        color="#D8BF6A"
                    />
                    <SettingsItem
                        icon="lock-closed-outline"
                        label="Privacy"
                        subLabel="Security and encryption"
                        isLast
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(196,115,74,0.08)"
                        color="#A85D3A"
                    />
                </View>
            </View>

            <View style={s.section}>
                <Text style={[s.sectionTitle, { color: accent }]}>Account</Text>
                <View style={[s.sectionCard, { backgroundColor: surface }]}>
                    <SettingsItem
                        icon="person-outline"
                        label="Profile"
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(196,115,74,0.12)"
                        color="#C4734A"
                        onPress={() => navigation.navigate("Profile")}
                    />
                    <SettingsItem
                        icon="help-circle-outline"
                        label="Help & Support"
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(168,93,58,0.1)"
                        color="#A85D3A"
                    />
                    <SettingsItem
                        icon="log-out-outline"
                        label="Logout"
                        isLast
                        color={danger}
                        onPress={handleLogout}
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                        border={border}
                        accent={accent}
                        iconBg="rgba(231,76,60,0.1)"
                    />
                </View>
            </View>

            <Text style={[s.versionTxt, { color: textSecondary }]}>Klyro v1.0.0</Text>
            <View style={{ height: 120 }} />

            {/* QR Code Modal */}
            <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
                <View style={s.qrOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowQR(false)} />
                    <View style={[s.qrCard, { backgroundColor: surface }]}>
                        <View style={s.qrHeader}>
                            <View style={[s.qrAvatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}>
                                {user?.profilePic ? (
                                    <Image source={{ uri: user.profilePic }} style={s.avatarImg} />
                                ) : (
                                    <Text style={[s.avatarTxt, { color: isDark ? "#fff" : "#C4734A" }]}>{user?.username?.charAt(0)?.toUpperCase()}</Text>
                                )}
                            </View>
                            <View style={s.qrInfo}>
                                <Text style={[s.qrName, { color: textPrimary }]}>{user?.name || user?.username || "Klyro User"}</Text>
                                <Text style={[s.qrUsername, { color: textSecondary }]}>@{user?.username || "user"}</Text>
                            </View>
                        </View>
                        
                        <View style={s.qrCodeWrapper}>
                            <QRCode
                                value={`klyro://user/${user?.username}`}
                                size={180}
                                color={textPrimary}
                                backgroundColor={surface}
                                logo={require("../../assets/KlyroLightLogo.png")}
                                logoSize={40}
                                logoBackgroundColor={surface}
                            />
                        </View>
                        
                        <Text style={[s.qrFooterTxt, { color: textSecondary }]}>
                            Scan this code to start a chat on Klyro.
                        </Text>
                        
                        <TouchableOpacity style={[s.closeQRBtn, { backgroundColor: accent }]} onPress={() => setShowQR(false)}>
                            <Text style={s.closeQRTxt}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
    
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        padding: 16,
        borderRadius: radius.xl,
        marginBottom: 32,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    avatarImg: { width: "100%", height: "100%", borderRadius: 30 },
    avatarTxt: { fontSize: 24, fontWeight: "700" },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
    profileAbout: { fontSize: 14 },

    section: { marginBottom: 24, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 12, marginLeft: 8, letterSpacing: 1 },
    sectionCard: { borderRadius: radius.xl, overflow: "hidden" },
    
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    iconBg: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    itemContent: { flex: 1 },
    itemLabel: { fontSize: 16, fontWeight: "600" },
    itemSubLabel: { fontSize: 13, marginTop: 1 },
    
    versionTxt: { textAlign: "center", fontSize: 12, fontWeight: "500", marginTop: 8 },
    
    // QR Modal Styles
    qrOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    qrCard: { width: "80%", borderRadius: radius.xl, padding: 24, alignItems: "center", ...shadows.xl },
    qrHeader: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 24 },
    qrAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 12 },
    qrInfo: { flex: 1 },
    qrName: { fontSize: 18, fontWeight: "700" },
    qrUsername: { fontSize: 14 },
    qrCodeWrapper: { padding: 16, backgroundColor: "#fff", borderRadius: radius.lg, ...shadows.md, marginBottom: 24 },
    qrFooterTxt: { textAlign: "center", fontSize: 13, marginBottom: 24, paddingHorizontal: 10 },
    closeQRBtn: { width: "100%", paddingVertical: 14, borderRadius: radius.lg, alignItems: "center" },
    closeQRTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
