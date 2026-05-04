import React, { useEffect, useState, useContext, useCallback } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image,
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

    // Dynamic Theme Colors
    const bg = isDark ? "#111b21" : "#fff";
    const surface = isDark ? "#202c33" : "#f5f5f5";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#666";
    const border = isDark ? "#202c33" : "#f0f0f0";
    const iconBtnBg = isDark ? "#2a3942" : "#f5f5f5";
    const accentGreen = "#25D366";

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
        }, [])
    );

    // ─── Build merged chat list ───
    // Combine users with conversation data (last message, unread count)
    const getChatList = () => {
        const convMap = {};
        conversations.forEach(conv => {
            const uid = conv._id || conv.userInfo?._id;
            if (uid) convMap[uid] = conv;
        });

        // Users who have conversations, sorted by last message time
        const usersWithConvs = [];
        const usersWithoutConvs = [];

        users.forEach(user => {
            const conv = convMap[user._id];
            if (conv && conv.lastMessage) {
                usersWithConvs.push({ ...user, conversation: conv });
            } else {
                usersWithoutConvs.push({ ...user, conversation: null });
            }
        });

        // Sort conversations by last message time (newest first)
        usersWithConvs.sort((a, b) => {
            const tA = new Date(a.conversation.lastMessage.createdAt).getTime();
            const tB = new Date(b.conversation.lastMessage.createdAt).getTime();
            return tB - tA;
        });

        return [...usersWithConvs, ...usersWithoutConvs];
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

            {/* User List */}
            {loading ? (
                <View style={s.loaderWrap}>
                    <ActivityIndicator size="large" color={textMain} />
                </View>
            ) : (
                <FlatList
                    data={filteredList}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <ChatItem item={item} />}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        filteredList.length === 0 && (
                            <View style={s.emptyWrap}>
                                <Ionicons name="search-outline" size={48} color={border} />
                                <Text style={[s.emptyTxt, { color: textSub }]}>No chats found</Text>
                            </View>
                        )
                    }
                />
            )}

            {/* Bottom Navigation */}
            <View style={[s.bottomNav, { backgroundColor: bg, borderTopColor: border }]}>
                <TouchableOpacity style={s.navItem}>
                    <Ionicons name="home" size={22} color={textMain} />
                </TouchableOpacity>

                <TouchableOpacity style={s.newChatBtn} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={s.newChatTxt}>New Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate("Settings")}>
                    <Ionicons name="person-outline" size={22} color={textSub} />
                </TouchableOpacity>
            </View>
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
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
    emptyTxt: { fontSize: 16, marginTop: 12 },

    // Bottom Nav
    bottomNav: {
        flexDirection: "row", justifyContent: "space-around", alignItems: "center",
        paddingVertical: 12, borderTopWidth: 1,
        position: "absolute", bottom: 0, width: "100%", paddingBottom: Platform.OS === "ios" ? 24 : 12,
    },
    navItem: { padding: 8 },
    newChatBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#1a1a2e", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    },
    newChatTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
