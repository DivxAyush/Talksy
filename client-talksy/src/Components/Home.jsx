import React, { useEffect, useState, useContext, useCallback, useMemo, useRef } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image, Modal, Animated, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";
import { useFocusEffect } from "@react-navigation/native";

export default function Home({ navigation, setIsLoggedIn }) {
    const [search, setSearch] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");

    // Profile popup state
    const [popupUser, setPopupUser] = useState(null);
    const [popupVisible, setPopupVisible] = useState(false);
    const popupAnim = useRef(new Animated.Value(0)).current;

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
    const accentPurple = "#5B5FC7";
    const accentGreen = "#25D366";

    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            if (id) setCurrentUserId(id);
        })();
    }, []);

    // Smart fetch — only re-fetches if stale (>30s) thanks to ChatContext caching
    useFocusEffect(
        useCallback(() => {
            setCurrentChat(null); // Not in any chat
            fetchConversations(); // Will skip if cache is fresh
        }, [])
    );

    // ─── Build chat list directly from conversations (no separate users API call) ───
    const chatList = useMemo(() => {
        return conversations
            .filter(conv => conv.lastMessage)
            .map(conv => ({
                _id: conv._id || conv.userInfo?._id,
                username: conv.userInfo?.username,
                name: conv.userInfo?.name,
                profilePic: conv.userInfo?.profilePic,
                about: conv.userInfo?.about,
                conversation: conv,
            }));
    }, [conversations]);
    const filteredList = search
        ? chatList.filter(u =>
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.name?.toLowerCase().includes(search.toLowerCase())
        )
        : chatList;

    const handleSearch = (text) => {
        setSearch(text);
    };

    // ─── Profile Popup ───
    const showProfilePopup = (user) => {
        setPopupUser(user);
        setPopupVisible(true);
        Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    };
    const hideProfilePopup = () => {
        Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setPopupVisible(false);
            setPopupUser(null);
        });
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

        let previewText = "Tap to start chatting...";
        if (lastMsg) {
            if (lastMsg.isDeleted) {
                previewText = "🚫 This message was deleted";
            } else if (lastMsg.messageType === "image") {
                previewText = "📷 Photo";
            } else if (lastMsg.messageType === "video") {
                previewText = "🎥 Video";
            } else if (lastMsg.messageType === "voice") {
                previewText = "🎤 Voice message";
            } else {
                previewText = lastMsg.message;
            }
        }

        return (
            <TouchableOpacity
                style={[s.chatItem, { borderBottomColor: border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("chatUser", { user: item })}
            >
                <TouchableOpacity onPress={() => showProfilePopup(item)} activeOpacity={0.8}>
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
                </TouchableOpacity>
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


    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <View style={s.headerTop}>
                    <Text style={[s.logo, { color: textMain }]}>Talksy</Text>
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

            {/* Chat List */}
            {loadingConversations && conversations.length === 0 ? (
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

            {/* ─── Profile Popup Modal ─── */}
            <Modal visible={popupVisible} transparent animationType="none" onRequestClose={hideProfilePopup}>
                <Pressable style={s.popupOverlay} onPress={hideProfilePopup}>
                    <Animated.View style={[s.popupBackdrop, { opacity: popupAnim }]} />
                    <Animated.View style={[s.popupCard, {
                        backgroundColor: isDark ? "#202c33" : "#fff",
                        opacity: popupAnim,
                        transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                    }]}>
                        {popupUser?.profilePic ? (
                            <Image
                                source={{ uri: popupUser.profilePic }}
                                style={s.popupImage}
                            />
                        ) : (
                            <View style={[s.popupAvatarPlaceholder, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
                                <Text style={s.popupAvatarTxt}>
                                    {popupUser?.username?.charAt(0)?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={[s.popupName, { color: textMain }]}>
                            {popupUser?.name || popupUser?.username}
                        </Text>
                        {popupUser?.about ? (
                            <Text style={[s.popupAbout, { color: textSub }]}>
                                {popupUser.about}
                            </Text>
                        ) : null}
                    </Animated.View>
                </Pressable>
            </Modal>
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

    // Profile Popup
    popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    popupCard: {
        width: 280, borderRadius: 20, alignItems: "center",
        paddingBottom: 24, overflow: "hidden",
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
    },
    popupImage: { width: 280, height: 280, resizeMode: "cover" },
    popupAvatarPlaceholder: {
        width: 280, height: 280, justifyContent: "center", alignItems: "center",
    },
    popupAvatarTxt: { color: "#fff", fontSize: 80, fontWeight: "700" },
    popupName: { fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" },
    popupAbout: { fontSize: 14, marginTop: 4, textAlign: "center", paddingHorizontal: 16 },

});

