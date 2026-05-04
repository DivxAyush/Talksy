import React, { useEffect, useState, useContext } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";

const API = "https://talksy-3py1.onrender.com/api/users";

export default function Home({ navigation, setIsLoggedIn }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const { isDark } = useContext(ThemeContext);
    const { onlineUsers } = useContext(SocketContext);

    // Dynamic Theme Colors
    const bg = isDark ? "#111b21" : "#fff";
    const surface = isDark ? "#202c33" : "#f5f5f5";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#666";
    const border = isDark ? "#202c33" : "#f0f0f0";
    const iconBtnBg = isDark ? "#2a3942" : "#f5f5f5";

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setIsLoggedIn(false);
    };

    const loadUsers = async () => {
        try {
            const currentUserId = await AsyncStorage.getItem("userId");
            const { data } = await axios.get(`${API}/users`);
            
            const filteredData = data.users.filter(u => u._id !== currentUserId);
            
            setUsers(filteredData);
            setFilteredUsers(filteredData);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleSearch = (text) => {
        setSearch(text);
        if (!text) return setFilteredUsers(users);
        setFilteredUsers(users.filter((u) => u.username?.toLowerCase().includes(text.toLowerCase())));
    };

    const ChatItem = ({ item }) => (
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
                    <Text style={[s.chatName, { color: textMain }]} numberOfLines={1}>{item.username}</Text>
                    <Text style={[s.chatTime, { color: textSub }]}>Today</Text>
                </View>
                <Text style={[s.chatPreview, { color: textSub }]} numberOfLines={1}>Tap to view messages...</Text>
            </View>
        </TouchableOpacity>
    );

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
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <ChatItem item={item} />}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        filteredUsers.length === 0 && (
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
    chatName: { fontSize: 16, fontWeight: "600" },
    chatTime: { fontSize: 12 },
    chatPreview: { fontSize: 14 },

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
