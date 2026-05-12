import React, { useEffect, useState, useContext, useCallback, useMemo, useRef } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image, Modal, Animated, Pressable,
    LayoutAnimation, UIManager, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeColors } from "../hooks/chat/useThemeColors";
import { spacing, radius, typography, shadows, iconSize, avatarSize } from "../theme/designTokens";
import { ChatListSkeleton } from "./chat/SkeletonLoader";

// ─── Module-level helpers (never recreated) ───
const chatKeyExtractor = (item) => item._id;

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

// ─── Extracted & Memoized StatusIcon ───
const StatusIcon = React.memo(({ status, tickRead, textTertiary }) => {
    if (status === "read") {
        return <Ionicons name="checkmark-done" size={16} color={tickRead} style={{ marginRight: 4 }} />;
    }
    if (status === "delivered") {
        return <Ionicons name="checkmark-done" size={16} color={textTertiary} style={{ marginRight: 4 }} />;
    }
    return <Ionicons name="checkmark" size={16} color={textTertiary} style={{ marginRight: 4 }} />;
});

// ─── Extracted & Memoized ChatItem ───
const ChatItem = React.memo(({ item, currentUserId, navigation, onProfilePress, isDark, bg, textPrimary, textSecondary, textTertiary, border, unreadBg, unreadText, tickRead, isOnline, accent }) => {
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
            style={[s.chatItem]}
            activeOpacity={0.6}
            onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate("chatUser", { user: item });
            }}
        >
            <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onProfilePress(item);
            }} activeOpacity={0.8}>
                <View style={[s.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}>
                    {item?.profilePic ? (
                        <Image source={{ uri: item.profilePic }} style={{ width: "100%", height: "100%", borderRadius: radius.avatar.lg }} />
                    ) : (
                        <Text style={[s.avatarTxt, { color: isDark ? "#FFFFFF" : "#C4734A" }]}>{item?.username?.charAt(0)?.toUpperCase()}</Text>
                    )}
                </View>
                {isOnline && (
                    <View style={[s.onlineDot, { borderColor: bg, backgroundColor: accent }]} />
                )}
            </TouchableOpacity>
            <View style={[s.chatInfo, { borderBottomColor: border, borderBottomWidth: 0.5 }]}>
                <View style={s.chatHeader}>
                    <Text style={[s.chatName, { color: textPrimary }]} numberOfLines={1}>
                        {item.name || item.username}
                    </Text>
                    <Text style={[
                        s.chatTime,
                        { color: hasUnread ? unreadBg : textTertiary }
                    ]}>
                        {lastMsg ? formatChatTime(lastMsg.createdAt) : ""}
                    </Text>
                </View>
                <View style={s.previewRow}>
                    <View style={s.previewTextWrap}>
                        {isSentByMe && lastMsg && !lastMsg.isDeleted && (
                            <StatusIcon status={lastMsg.status} tickRead={tickRead} textTertiary={textTertiary} />
                        )}
                        <Text
                            style={[
                                s.chatPreview,
                                { color: hasUnread ? textPrimary : textSecondary },
                                hasUnread && { fontWeight: "600" }
                            ]}
                            numberOfLines={1}
                        >
                            {previewText}
                        </Text>
                    </View>
                    {hasUnread && (
                        <View style={[s.unreadBadge, { backgroundColor: unreadBg }]}>
                            <Text style={[s.unreadTxt, { color: unreadText }]}>
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    const prevConv = prev.item.conversation;
    const nextConv = next.item.conversation;
    return (
        prev.item._id === next.item._id &&
        prev.isOnline === next.isOnline &&
        prev.isDark === next.isDark &&
        prevConv?.lastMessage?._id === nextConv?.lastMessage?._id &&
        prevConv?.lastMessage?.status === nextConv?.lastMessage?.status &&
        prevConv?.lastMessage?.message === nextConv?.lastMessage?.message &&
        prevConv?.lastMessage?.isDeleted === nextConv?.lastMessage?.isDeleted &&
        prevConv?.unreadCount === nextConv?.unreadCount &&
        prev.item.name === next.item.name &&
        prev.item.profilePic === next.item.profilePic
    );
});

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

    const colors = useThemeColors();
    const { bg, surface, textPrimary, textSecondary, textTertiary, border, unreadBg, unreadText, tickRead, accent } = colors;

    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            if (id) setCurrentUserId(id);
        })();
    }, []);

    // Smooth reordering animation
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [conversations]);

    useFocusEffect(
        useCallback(() => {
            setCurrentChat(null);
            fetchConversations();
        }, [])
    );

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

    const filteredList = useMemo(() => {
        if (!search) return chatList;
        const term = search.toLowerCase();
        return chatList.filter(u =>
            u.username?.toLowerCase().includes(term) ||
            u.name?.toLowerCase().includes(term)
        );
    }, [chatList, search]);

    const handleSearch = useCallback((text) => {
        setSearch(text);
    }, []);

    const showProfilePopup = useCallback((user) => {
        setPopupUser(user);
        setPopupVisible(true);
        Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, [popupAnim]);

    const hideProfilePopup = useCallback(() => {
        Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setPopupVisible(false);
            setPopupUser(null);
        });
    }, [popupAnim]);

    const renderChatItem = useCallback(({ item }) => (
        <ChatItem
            item={item}
            currentUserId={currentUserId}
            navigation={navigation}
            onProfilePress={showProfilePopup}
            isDark={isDark}
            bg={bg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            textTertiary={textTertiary}
            border={border}
            unreadBg={unreadBg}
            unreadText={unreadText}
            tickRead={tickRead}
            isOnline={onlineUsers.includes(item._id)}
            accent={accent}
        />
    ), [currentUserId, navigation, showProfilePopup, isDark, bg, textPrimary, textSecondary, textTertiary, border, unreadBg, unreadText, tickRead, onlineUsers, accent]);

    const EmptyConversations = useMemo(() => (
        <View style={s.emptyWrap}>
            <View style={[s.emptyIconBg, { backgroundColor: isDark ? "#1C1C1E" : "#F1D7D1" }]}>
                <Ionicons name="chatbubbles-outline" size={iconSize.huge} color={isDark ? "#636366" : "#C4734A"} />
            </View>
            <Text style={[s.emptyTitle, { color: textPrimary }]}>No chats yet</Text>
            <Text style={[s.emptySub, { color: textSecondary }]}>
                Tap the button below to start a{"\n"}conversation with your contacts
            </Text>
            <TouchableOpacity
                style={[s.startChatBtn, { backgroundColor: accent }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("NewChat")}
            >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.startChatBtnTxt}>Start a Chat</Text>
            </TouchableOpacity>
        </View>
    ), [isDark, textPrimary, textSecondary, accent, navigation]);

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
            {/* Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <View style={s.headerTop}>
                    <Text style={[s.logo, { color: textPrimary }]}>Chat</Text>
                    <View style={s.headerActions}>
                        <TouchableOpacity style={[s.headerIconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(196,115,74,0.08)" }]}>
                            <Ionicons name="search" size={20} color={textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search */}
                <View style={[s.searchBox, { backgroundColor: surface }]}>
                    <Ionicons name="search" size={20} color={textTertiary} style={s.searchIcon} />
                    <TextInput
                        style={[s.searchInput, { color: textPrimary }]}
                        placeholder="Search conversation..."
                        placeholderTextColor={textTertiary}
                        value={search}
                        onChangeText={handleSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => handleSearch("")}>
                            <Ionicons name="close-circle" size={18} color={textTertiary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Chat List */}
            {loadingConversations && conversations.length === 0 ? (
                <ChatListSkeleton baseColor={isDark ? "#2C2C2E" : "#F1D7D1"} />
            ) : (
                <FlatList
                    data={filteredList}
                    keyExtractor={chatKeyExtractor}
                    renderItem={renderChatItem}
                    contentContainerStyle={[s.listContent, filteredList.length === 0 && { flex: 1 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={EmptyConversations}
                    windowSize={7}
                    initialNumToRender={12}
                    maxToRenderPerBatch={6}
                    updateCellsBatchingPeriod={50}
                    removeClippedSubviews={Platform.OS === "android"}
                />
            )}

            {/* Profile Popup Modal */}
            <Modal visible={popupVisible} transparent animationType="none" onRequestClose={hideProfilePopup}>
                <Pressable style={s.popupOverlay} onPress={hideProfilePopup}>
                    <Animated.View style={[s.popupBackdrop, { opacity: popupAnim }]} />
                    <Animated.View style={[s.popupCard, {
                        backgroundColor: isDark ? "#2C2C2E" : "#fff",
                        opacity: popupAnim,
                        transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                    }]}>
                        {popupUser?.profilePic ? (
                            <Image
                                source={{ uri: popupUser.profilePic }}
                                style={s.popupImage}
                            />
                        ) : (
                            <View style={[s.popupAvatarPlaceholder, { backgroundColor: isDark ? "#3A3A3C" : "#C4734A" }]}>
                                <Text style={s.popupAvatarTxt}>
                                    {popupUser?.username?.charAt(0)?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={s.popupNameContainer}>
                            <Text style={[s.popupName, { color: textPrimary }]}>
                                {popupUser?.name || popupUser?.username}
                            </Text>
                            {popupUser?.about ? (
                                <Text style={[s.popupAbout, { color: textSecondary }]}>
                                    {popupUser.about}
                                </Text>
                            ) : null}
                        </View>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    logo: { fontSize: typography.h1.fontSize, fontWeight: "800", letterSpacing: -0.5 },
    headerActions: { flexDirection: "row", gap: 8 },
    headerIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: "center", alignItems: "center",
    },
    searchBox: {
        flexDirection: "row", alignItems: "center", borderRadius: radius.md,
        paddingHorizontal: 12, height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, height: "100%" },

    // List
    listContent: { paddingBottom: 100 },
    chatItem: {
        flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    },
    avatar: {
        width: 52, height: 52, borderRadius: radius.avatar.lg,
        justifyContent: "center", alignItems: "center", marginRight: 14,
        marginVertical: 12,
    },
    avatarTxt: { fontSize: 20, fontWeight: "600" },
    onlineDot: {
        width: 14, height: 14, borderRadius: 7,
        position: "absolute", bottom: 12, right: 14, borderWidth: 2,
    },
    chatInfo: { flex: 1, paddingVertical: 14, height: "100%" },
    chatHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
    chatName: { fontSize: 16.5, fontWeight: "700", flex: 1, marginRight: 8, letterSpacing: -0.2 },
    chatTime: { fontSize: 12, fontWeight: "500" },
    previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    previewTextWrap: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
    chatPreview: { fontSize: 14.5, flex: 1, lineHeight: 20 },

    // Unread Badge
    unreadBadge: {
        borderRadius: radius.pill,
        minWidth: 22, height: 22, paddingHorizontal: 6,
        justifyContent: "center", alignItems: "center",
    },
    unreadTxt: { fontSize: 11, fontWeight: "700" },

    // Empty State
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
    emptyIconBg: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: "center", alignItems: "center", marginBottom: 24,
    },
    emptyTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    startChatBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingHorizontal: 24, paddingVertical: 14, borderRadius: 28,
        ...shadows.md,
    },
    startChatBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

    // Profile Popup
    popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    popupCard: {
        width: 280, borderRadius: radius.xl, alignItems: "center",
        overflow: "hidden", ...shadows.xl,
    },
    popupImage: { width: 280, height: 280, resizeMode: "cover" },
    popupAvatarPlaceholder: {
        width: 280, height: 280, justifyContent: "center", alignItems: "center",
    },
    popupAvatarTxt: { color: "#fff", fontSize: 80, fontWeight: "700" },
    popupNameContainer: { padding: 20, alignItems: "center", width: "100%" },
    popupName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
    popupAbout: { fontSize: 14, marginTop: 6, textAlign: "center", paddingHorizontal: 16 },

});
