import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";
import { useFocusEffect } from "@react-navigation/native";

const API_USERS = "https://talksy-3py1.onrender.com/api/users";

export default function Home({ navigation, setIsLoggedIn }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState("");

    const { isDark } = useContext(ThemeContext);
    const { onlineUsers } = useContext(SocketContext);
    const {
        conversations,
        fetchConversations,
        loadingConversations,
        setCurrentChat
    } = useContext(ChatContext);

    // ─── Fab Animation ───
    const fabScale = useRef(new Animated.Value(0)).current;
    const fabRotate = useRef(new Animated.Value(0)).current;

    // Dynamic Theme Colors
    const bg = isDark ? "#111b21" : "#fff";
    const surface = isDark ? "#202c33" : "#f5f5f5";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#666";
    const border = isDark ? "#202c33" : "#f0f0f0";
    const iconBtnBg = isDark ? "#2a3942" : "#f5f5f5";
    const accentGreen = "#25D366";
    const accentTeal = isDark ? "#00a884" : "#008069";
    const accentPurple = "#5B5FC7";

    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            if (id) setCurrentUserId(id);
        })();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setIsLoggedIn(false);
    };

    const loadUsers = async () => {
        try {
            const id = await AsyncStorage.getItem("userId");
            const { data } = await axios.get(`${API_USERS}/users`);
            const filtered = data.users.filter(u => u._id !== id);
            setUsers(filtered);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // Refresh conversations when screen is focused
    useFocusEffect(
        useCallback(() => {
            setCurrentChat(null); // Not in any chat
            loadUsers();
            fetchConversations();

            // Animate FAB in
            Animated.sequence([
                Animated.delay(300),
                Animated.parallel([
                    Animated.spring(fabScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
                    Animated.timing(fabRotate, { toValue: 1, duration: 400, useNativeDriver: true }),
                ]),
            ]).start();

            return () => {
                fabScale.setValue(0);
                fabRotate.setValue(0);
            };
        }, [])
    );

    // ─── Build chat list: only users with conversations ───
    const getChatList = () => {
        const convMap = {};
        conversations.forEach(conv => {
            const uid = conv._id || conv.userInfo?._id;
            if (uid) convMap[uid] = conv;
        });

        const usersWithConvs = [];

        users.forEach(user => {
            const conv = convMap[user._id];
            if (conv && conv.lastMessage) {
                usersWithConvs.push({ ...user, conversation: conv });
            }
        });

        // Also include conversations that might not be in users list (from server)
        conversations.forEach(conv => {
            const uid = conv._id || conv.userInfo?._id;
            if (uid && conv.lastMessage && !usersWithConvs.find(u => u._id === uid)) {
                const userInfo = conv.userInfo || {};
                usersWithConvs.push({
                    _id: uid,
                    username: userInfo.username,
                    name: userInfo.name,
                    profilePic: userInfo.profilePic,
                    about: userInfo.about,
                    conversation: conv,
                });
            }
        });

        // Sort by last message time (newest first)
        usersWithConvs.sort((a, b) => {
            const tA = new Date(a.conversation.lastMessage.createdAt).getTime();
            const tB = new Date(b.conversation.lastMessage.createdAt).getTime();
            return tB - tA;
        });

        return usersWithConvs;
    };

    const chatList = getChatList();

    const filteredList = search
        ? chatList.filter(u =>
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.name?.toLowerCase().includes(search.toLowerCase())
        )
        : chatList;

    const handleSearch = (text) => {
        setSearch(text);
    };

    // ─── Format timestamp for chat list ───
    const formatChatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const oneDay = 86400000;

        if (diff < oneDay && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        if (diff < 2 * oneDay) return "Yesterday";

        if (diff < 7 * oneDay) {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return days[date.getDay()];
        }

        return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
    };

    // ─── Message status icon for sent messages ───
    const StatusIcon = ({ status }) => {
        if (status === "read") {
            return <Ionicons name="checkmark-done" size={16} color="#53bdeb" style={{ marginRight: 4 }} />;
        }
        if (status === "delivered") {
            return <Ionicons name="checkmark-done" size={16} color={textSub} style={{ marginRight: 4 }} />;
        }
        return <Ionicons name="checkmark" size={16} color={textSub} style={{ marginRight: 4 }} />;
    };

    const ChatItem = ({ item }) => {
        const conv = item.conversation;
        const lastMsg = conv?.lastMessage;
        const unreadCount = conv?.unreadCount || 0;
        const hasUnread = unreadCount > 0;
        const isSentByMe = lastMsg?.senderId === currentUserId;

        const previewText = lastMsg
            ? (lastMsg.isDeleted
                ? "🚫 This message was deleted"
                : lastMsg.message)
            : "Tap to start chatting...";

        return (
            <TouchableOpacity
                style={[s.chatItem, { borderBottomColor: border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("chatUser", { user: item })}
            >
                <View>
                    <View style={[s.avatar, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
                        {item?.profilePic ? (
                            <Image source={{ uri: item.profilePic }} style={{ width: "100%", height: "100%", borderRadius: 25 }} />
                        ) : (
                            <Text style={s.avatarTxt}>{item?.username?.charAt(0)?.toUpperCase()}</Text>
                        )}
                    </View>
                    {onlineUsers.includes(item._id) && (
                        <View style={[s.onlineDot, { borderColor: bg }]} />
                    )}
                </View>
                <View style={s.chatInfo}>
                    <View style={s.chatHeader}>
                        <Text style={[s.chatName, { color: textMain }]} numberOfLines={1}>
                            {item.name || item.username}
                        </Text>
                        <Text style={[
                            s.chatTime,
                            { color: hasUnread ? accentGreen : textSub }
                        ]}>
                            {lastMsg ? formatChatTime(lastMsg.createdAt) : ""}
                        </Text>
                    </View>
                    <View style={s.previewRow}>
                        <View style={s.previewTextWrap}>
                            {isSentByMe && lastMsg && !lastMsg.isDeleted && (
                                <StatusIcon status={lastMsg.status} />
                            )}
                            <Text
                                style={[
                                    s.chatPreview,
                                    { color: hasUnread ? textMain : textSub },
                                    hasUnread && { fontWeight: "600" }
                                ]}
                                numberOfLines={1}
                            >
                                {previewText}
                            </Text>
                        </View>
                        {hasUnread && (
                            <View style={s.unreadBadge}>
                                <Text style={s.unreadTxt}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ─── Empty State for No Conversations ───
    const EmptyConversations = () => (
        <View style={s.emptyWrap}>
            <View style={[s.emptyIconBg, { backgroundColor: isDark ? "#1f2c34" : "#f0f4f5" }]}>
                <Ionicons name="chatbubbles-outline" size={52} color={isDark ? "#3b5360" : "#c8d6db"} />
            </View>
            <Text style={[s.emptyTitle, { color: textMain }]}>No chats yet</Text>
            <Text style={[s.emptySub, { color: textSub }]}>
                Tap the button below to start a{"\n"}conversation with your contacts
            </Text>
            <TouchableOpacity
                style={[s.startChatBtn, { backgroundColor: accentPurple }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("NewChat")}
            >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.startChatBtnTxt}>Start a Chat</Text>
            </TouchableOpacity>
        </View>
    );

    // FAB rotation interpolation
    const fabRotateInterpolate = fabRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "135deg"],
    });

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <View style={s.headerTop}>
                    <Text style={[s.logo, { color: textMain }]}>Talksy</Text>
                    <TouchableOpacity style={[s.iconBtn, { backgroundColor: iconBtnBg }]} onPress={handleLogout}>
                        <Ionicons name="ellipsis-vertical" size={20} color={textMain} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={[s.searchBox, { backgroundColor: surface }]}>
                    <Ionicons name="search" size={20} color={textSub} style={s.searchIcon} />
                    <TextInput
                        style={[s.searchInput, { color: textMain }]}
                        placeholder="Search Your Fav Person"
                        placeholderTextColor={textSub}
                        value={search}
                        onChangeText={handleSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => handleSearch("")}>
                            <Ionicons name="close-circle" size={18} color={textSub} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Chat List - Only Active Conversations */}
            {loading ? (
                <View style={s.loaderWrap}>
                    <ActivityIndicator size="large" color={textMain} />
                </View>
            ) : (
                <FlatList
                    data={filteredList}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <ChatItem item={item} />}
                    contentContainerStyle={[s.listContent, filteredList.length === 0 && { flex: 1 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<EmptyConversations />}
                />
            )}

            {/* Bottom Navigation */}
            <View style={[s.bottomNav, { backgroundColor: bg, borderTopColor: border }]}>
                <TouchableOpacity style={s.navItem}>
                    <Ionicons name="home" size={22} color={textMain} />
                </TouchableOpacity>

                <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate("Settings")}>
                    <Ionicons name="person-outline" size={22} color={textSub} />
                </TouchableOpacity>
            </View>

            {/* ─── Floating Purple FAB ─── */}
            <Animated.View style={[s.fabWrap, {
                transform: [
                    { scale: fabScale },
                ],
            }]}>
                <TouchableOpacity
                    style={[s.fab, { backgroundColor: accentPurple }]}
                    activeOpacity={0.85}
                    onPress={() => {
                        // Rotate animation on press
                        Animated.spring(fabRotate, {
                            toValue: fabRotate.__getValue() === 0 ? 1 : 0,
                            tension: 60,
                            friction: 6,
                            useNativeDriver: true,
                        }).start();
                        navigation.navigate("NewChat");
                    }}
                >
                    <Animated.View style={{ transform: [{ rotate: fabRotateInterpolate }] }}>
                        <Ionicons name="add" size={30} color="#fff" />
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    logo: { fontSize: 28, fontWeight: "800" },
    iconBtn: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: "center", alignItems: "center",
    },
    searchBox: {
        flexDirection: "row", alignItems: "center", borderRadius: 12,
        paddingHorizontal: 12, height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, height: "100%" },

    // List
    listContent: { paddingBottom: 100 },
    chatItem: {
        flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: "center", alignItems: "center", marginRight: 14,
    },
    avatarTxt: { color: "#fff", fontSize: 20, fontWeight: "600" },
    onlineDot: {
        width: 14, height: 14, borderRadius: 7, backgroundColor: "#25D366",
        position: "absolute", bottom: 2, right: 14, borderWidth: 2,
    },
    chatInfo: { flex: 1 },
    chatHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    chatName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
    chatTime: { fontSize: 12 },
    previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    previewTextWrap: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
    chatPreview: { fontSize: 14, flex: 1 },

    // Unread Badge
    unreadBadge: {
        backgroundColor: "#25D366", borderRadius: 12,
        minWidth: 24, height: 24, paddingHorizontal: 6,
        justifyContent: "center", alignItems: "center",
    },
    unreadTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },

    // Loading / Empty
    loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Empty State
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
    emptyIconBg: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: "center", alignItems: "center", marginBottom: 24,
    },
    emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    startChatBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 28,
    },
    startChatBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

    // Bottom Nav
    bottomNav: {
        flexDirection: "row", justifyContent: "space-around", alignItems: "center",
        paddingVertical: 12, borderTopWidth: 1,
        position: "absolute", bottom: 0, width: "100%", paddingBottom: Platform.OS === "ios" ? 24 : 12,
    },
    navItem: { padding: 8 },

    // Floating Action Button
    fabWrap: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 90 : 76,
        right: 20,
        zIndex: 10,
    },
    fab: {
        width: 60, height: 60, borderRadius: 30,
        justifyContent: "center", alignItems: "center",
        shadowColor: "#5B5FC7",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
});
