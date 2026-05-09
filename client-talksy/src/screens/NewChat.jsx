import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image, Animated, Linking, Alert,
    Dimensions, StatusBar, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";

const API_CONTACTS = "https://talksy-3py1.onrender.com/api/contacts";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function NewChat({ navigation }) {
    const [contacts, setContacts] = useState([]);
    const [talksyUsers, setTalksyUsers] = useState([]);
    const [inviteContacts, setInviteContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const { isDark } = useContext(ThemeContext);
    const { onlineUsers } = useContext(SocketContext);

    // ─── Animations ───
    const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerAnim = useRef(new Animated.Value(-60)).current;
    const listItemAnims = useRef([]).current;

    // ─── Theme Colors ───
    const bg = isDark ? "#111b21" : "#fff";
    const surface = isDark ? "#202c33" : "#f5f5f5";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#666";
    const border = isDark ? "#2a3942" : "#f0f0f0";
    const accentGreen = "#25D366";
    const accentTeal = isDark ? "#00a884" : "#008069";
    const sectionBg = isDark ? "#182229" : "#f8f9fa";

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(headerAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();

        loadContacts();
    }, []);

    const normalizePhone = (phone) => {
        if (!phone) return "";
        const digits = phone.replace(/\D/g, "");
        return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const loadContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== "granted") {
                setPermissionDenied(true);
                setLoading(false);
                return;
            }

            const { data: contactsData } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
                sort: Contacts.SortTypes.FirstName,
            });

            if (contactsData.length === 0) {
                setLoading(false);
                return;
            }

            // Extract unique phone numbers
            const contactMap = {};
            contactsData.forEach(contact => {
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    contact.phoneNumbers.forEach(phone => {
                        const normalized = normalizePhone(phone.number);
                        if (normalized.length >= 10 && !contactMap[normalized]) {
                            contactMap[normalized] = {
                                id: contact.id,
                                name: contact.name || "Unknown",
                                phone: phone.number,
                                normalizedPhone: normalized,
                                image: contact.image?.uri || null,
                            };
                        }
                    });
                }
            });

            const allContacts = Object.values(contactMap);
            setContacts(allContacts);

            // Check which ones are on Talksy
            const userId = await AsyncStorage.getItem("userId");
            const phoneNumbers = allContacts.map(c => c.normalizedPhone);

            try {
                const { data } = await axios.post(`${API_CONTACTS}/check`, {
                    phoneNumbers,
                    userId,
                });

                if (data.success) {
                    const matchedSet = new Set(data.matchedMobiles);
                    const talksyUserMap = {};
                    data.registeredUsers.forEach(u => {
                        const norm = normalizePhone(u.mobile);
                        talksyUserMap[norm] = u;
                    });

                    const talksy = [];
                    const invite = [];

                    allContacts.forEach(contact => {
                        if (matchedSet.has(contact.normalizedPhone)) {
                            const serverUser = talksyUserMap[contact.normalizedPhone];
                            talksy.push({
                                ...contact,
                                talksyUser: serverUser,
                                isOnTalksy: true,
                            });
                        } else {
                            invite.push({
                                ...contact,
                                isOnTalksy: false,
                            });
                        }
                    });

                    // Sort talksy users: online first, then alphabetically
                    talksy.sort((a, b) => {
                        const aOnline = onlineUsers.includes(a.talksyUser?._id) ? 1 : 0;
                        const bOnline = onlineUsers.includes(b.talksyUser?._id) ? 1 : 0;
                        if (bOnline !== aOnline) return bOnline - aOnline;
                        return a.name.localeCompare(b.name);
                    });

                    invite.sort((a, b) => a.name.localeCompare(b.name));

                    setTalksyUsers(talksy);
                    setInviteContacts(invite);
                }
            } catch (err) {
                console.log("Contact check error:", err.message);
                // If API fails, show all as invite
                setInviteContacts(allContacts);
            }
        } catch (err) {
            console.log("Contact fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadContacts();
    }, []);

    const handleInvite = (contact) => {
        const message = `Hey! Join me on Talksy – the coolest chat app! 🚀\nDownload now: https://talksy.app`;
        const smsUrl = Platform.select({
            ios: `sms:${contact.phone}&body=${encodeURIComponent(message)}`,
            android: `sms:${contact.phone}?body=${encodeURIComponent(message)}`,
        });
        Linking.openURL(smsUrl).catch(() => {
            Alert.alert("Can't send SMS", "Please send the invite manually.");
        });
    };

    const handleStartChat = (contact) => {
        // Navigate to chatUser with the talksy user data
        navigation.replace("chatUser", {
            user: {
                _id: contact.talksyUser._id,
                username: contact.talksyUser.username,
                name: contact.talksyUser.name || contact.name,
                profilePic: contact.talksyUser.profilePic,
                about: contact.talksyUser.about,
                mobile: contact.talksyUser.mobile,
            }
        });
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 250, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            navigation.goBack();
        });
    };

    // ─── Filter logic ───
    const filteredTalksy = search
        ? talksyUsers.filter(c =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.talksyUser?.username?.toLowerCase().includes(search.toLowerCase())
        )
        : talksyUsers;

    const filteredInvite = search
        ? inviteContacts.filter(c =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search)
        )
        : inviteContacts;

    // ─── Build combined list with section headers ───
    const buildListData = () => {
        const data = [];
        if (filteredTalksy.length > 0) {
            data.push({ type: "header", title: `Contacts on Talksy`, count: filteredTalksy.length });
            filteredTalksy.forEach(c => data.push({ type: "talksy", ...c }));
        }
        if (filteredInvite.length > 0) {
            data.push({ type: "header", title: "Invite to Talksy", count: filteredInvite.length });
            filteredInvite.forEach(c => data.push({ type: "invite", ...c }));
        }
        return data;
    };

    const listData = buildListData();

    // ─── Contact Item ───
    const ContactItem = ({ item, index }) => {
        const itemAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.spring(itemAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                delay: Math.min(index * 30, 500),
                useNativeDriver: true,
            }).start();
        }, []);

        if (item.type === "header") {
            return (
                <View style={[styles.sectionHeader, { backgroundColor: sectionBg }]}>
                    <Text style={[styles.sectionTitle, { color: accentTeal }]}>
                        {item.title}
                    </Text>
                    <View style={[styles.sectionBadge, { backgroundColor: accentTeal + "20" }]}>
                        <Text style={[styles.sectionCount, { color: accentTeal }]}>
                            {item.count}
                        </Text>
                    </View>
                </View>
            );
        }

        const isOnTalksy = item.type === "talksy";
        const isOnline = isOnTalksy && onlineUsers.includes(item.talksyUser?._id);
        const displayName = isOnTalksy
            ? (item.talksyUser?.name || item.name)
            : item.name;
        const profilePic = isOnTalksy ? item.talksyUser?.profilePic : null;
        const username = isOnTalksy ? item.talksyUser?.username : null;

        return (
            <Animated.View style={{
                opacity: itemAnim,
                transform: [{ translateX: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            }}>
                <TouchableOpacity
                    style={[styles.contactItem, { borderBottomColor: border }]}
                    activeOpacity={0.65}
                    onPress={() => isOnTalksy ? handleStartChat(item) : handleInvite(item)}
                >
                    {/* Avatar */}
                    <View>
                        <View style={[styles.avatar, {
                            backgroundColor: isOnTalksy
                                ? (isDark ? "#2a3942" : "#1a1a2e")
                                : (isDark ? "#374045" : "#ddd"),
                        }]}>
                            {profilePic ? (
                                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                            ) : item.image ? (
                                <Image source={{ uri: item.image }} style={styles.avatarImg} />
                            ) : (
                                <Text style={[styles.avatarTxt, {
                                    color: isOnTalksy ? "#fff" : (isDark ? "#8696a0" : "#999")
                                }]}>
                                    {displayName?.charAt(0)?.toUpperCase()}
                                </Text>
                            )}
                        </View>
                        {isOnline && (
                            <View style={[styles.onlineDot, { borderColor: bg }]} />
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: textMain }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        {isOnTalksy ? (
                            <Text style={[styles.contactSub, { color: isOnline ? accentGreen : textSub }]}>
                                {isOnline ? "Online" : (item.talksyUser?.about || "Hey there! I am using Talksy.")}
                            </Text>
                        ) : (
                            <Text style={[styles.contactSub, { color: textSub }]} numberOfLines={1}>
                                {item.phone}
                            </Text>
                        )}
                    </View>

                    {/* Action */}
                    {isOnTalksy ? (
                        <View style={[styles.chatIconWrap, { backgroundColor: accentTeal + "18" }]}>
                            <Ionicons name="chatbubble" size={18} color={accentTeal} />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.inviteBtn, { backgroundColor: accentGreen + "15" }]}
                            onPress={() => handleInvite(item)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="paper-plane" size={14} color={accentGreen} style={{ marginRight: 4 }} />
                            <Text style={[styles.inviteTxt, { color: accentGreen }]}>Invite</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // ─── Permission Denied View ───
    const PermissionDeniedView = () => (
        <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "#1f2c34" : "#f0f4f5" }]}>
                <Ionicons name="lock-closed-outline" size={48} color={textSub} />
            </View>
            <Text style={[styles.emptyTitle, { color: textMain }]}>Contact Access Required</Text>
            <Text style={[styles.emptySub, { color: textSub }]}>
                Allow Talksy to access your contacts to find friends who are already on the app.
            </Text>
            <TouchableOpacity
                style={[styles.permissionBtn, { backgroundColor: accentTeal }]}
                onPress={() => Linking.openSettings()}
            >
                <Text style={styles.permissionBtnTxt}>Open Settings</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Animated.View style={[styles.container, { backgroundColor: bg, transform: [{ translateX: slideAnim }], opacity: fadeAnim }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#111b21" : "#fff"} />

            {/* ─── Header ─── */}
            <Animated.View style={[styles.header, { backgroundColor: bg, transform: [{ translateY: headerAnim }] }]}>
                <TouchableOpacity onPress={handleClose} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={textMain} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={[styles.headerTitle, { color: textMain }]}>New Chat</Text>
                    <Text style={[styles.headerSub, { color: textSub }]}>
                        {talksyUsers.length > 0
                            ? `${talksyUsers.length} contact${talksyUsers.length > 1 ? "s" : ""} on Talksy`
                            : "Select a contact"}
                    </Text>
                </View>
            </Animated.View>

            {/* ─── Search ─── */}
            <View style={[styles.searchWrap, { backgroundColor: bg }]}>
                <View style={[styles.searchBox, { backgroundColor: surface }]}>
                    <Ionicons name="search" size={20} color={textSub} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: textMain }]}
                        placeholder="Search name or number"
                        placeholderTextColor={textSub}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color={textSub} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* ─── Content ─── */}
            {loading ? (
                <View style={styles.loaderWrap}>
                    <View style={[styles.loaderBox, { backgroundColor: surface }]}>
                        <ActivityIndicator size="large" color={accentTeal} />
                        <Text style={[styles.loaderTxt, { color: textSub }]}>Syncing contacts...</Text>
                    </View>
                </View>
            ) : permissionDenied ? (
                <PermissionDeniedView />
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item, index) => item.type === "header" ? `header-${index}` : (item.talksyUser?._id || item.normalizedPhone || `${index}`)}
                    renderItem={({ item, index }) => <ContactItem item={item} index={index} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={accentTeal}
                            colors={[accentTeal]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "#1f2c34" : "#f0f4f5" }]}>
                                <Ionicons name="people-outline" size={48} color={textSub} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: textMain }]}>
                                {search ? "No contacts found" : "No contacts"}
                            </Text>
                            <Text style={[styles.emptySub, { color: textSub }]}>
                                {search ? "Try a different search" : "Add some contacts to your phone to get started."}
                            </Text>
                        </View>
                    }
                />
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: "row", alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 56 : 48, paddingBottom: 12,
        paddingHorizontal: 16,
    },
    backBtn: { padding: 6, marginRight: 8 },
    headerTitleWrap: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
    headerSub: { fontSize: 13, marginTop: 2 },

    // Search
    searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
    searchBox: {
        flexDirection: "row", alignItems: "center", borderRadius: 12,
        paddingHorizontal: 12, height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, height: "100%" },

    // Section Headers
    sectionHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
    },
    sectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
    sectionBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    sectionCount: { fontSize: 12, fontWeight: "700" },

    // Contact Item
    contactItem: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 0.5,
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: "center", alignItems: "center",
    },
    avatarImg: { width: 48, height: 48, borderRadius: 24 },
    avatarTxt: { fontSize: 18, fontWeight: "700" },
    onlineDot: {
        width: 14, height: 14, borderRadius: 7, backgroundColor: "#25D366",
        position: "absolute", bottom: 0, right: -2, borderWidth: 2.5,
    },
    contactInfo: { flex: 1, marginLeft: 14 },
    contactName: { fontSize: 16, fontWeight: "600" },
    contactSub: { fontSize: 13, marginTop: 2 },

    // Invite Button
    inviteBtn: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    },
    inviteTxt: { fontSize: 13, fontWeight: "700" },

    // Chat Icon (for talksy users)
    chatIconWrap: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: "center", alignItems: "center",
    },

    // List
    listContent: { paddingBottom: 40 },

    // Loading
    loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    loaderBox: {
        borderRadius: 20, padding: 32, alignItems: "center",
        width: 200,
    },
    loaderTxt: { marginTop: 16, fontSize: 14, fontWeight: "500" },

    // Empty
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, marginTop: 80 },
    emptyIconWrap: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: "center", alignItems: "center", marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

    // Permission Button
    permissionBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    permissionBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
