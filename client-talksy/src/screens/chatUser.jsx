import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Keyboard, Animated, Pressable, Alert,
    KeyboardAvoidingView, Modal, Vibration, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";

const API = "https://talksy-3py1.onrender.com/api/messages";

const ATTACH_OPTIONS = [
    { key: "camera", icon: "camera", label: "Camera", color: "#e74c3c" },
    { key: "gallery", icon: "images", label: "Gallery", color: "#2ecc71" },
    { key: "document", icon: "document-text", label: "Document", color: "#3498db" },
    { key: "audio", icon: "musical-notes", label: "Audio", color: "#e67e22" },
    { key: "location", icon: "location", label: "Location", color: "#9b59b6" },
];

export default function ChatUser({ route, navigation }) {
    const { user } = route.params;
    const receiverId = user._id || user.id;
    const userName = user.username || user.name || "User";

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [senderId, setSenderId] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [showAttach, setShowAttach] = useState(false);
    const [kbHeight, setKbHeight] = useState(300);
    const [kbOpen, setKbOpen] = useState(false);
    const isKeyboardOpen = useRef(false);

    const flatRef = useRef(null);
    const attachAnim = useRef(new Animated.Value(0)).current;

    const [selectedMsg, setSelectedMsg] = useState(null);
    const actionAnim = useRef(new Animated.Value(0)).current;

    const { isDark } = useContext(ThemeContext);
    const { socket, onlineUsers } = useContext(SocketContext);

    const isOnline = onlineUsers.includes(receiverId);

    // Dynamic Theme Colors
    const bg = isDark ? "#0b141a" : "#fafafa";
    const headerBg = isDark ? "#202c33" : "#fff";
    const surface = isDark ? "#202c33" : "#f5f5f5";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#999";
    const border = isDark ? "#202c33" : "#f0f0f0";
    const myBubble = isDark ? "#005c4b" : "#1a1a2e";
    const otherBubble = isDark ? "#202c33" : "#f0f0f0";
    const myBubbleTxt = isDark ? "#e9edef" : "#fff";
    const otherBubbleTxt = isDark ? "#e9edef" : "#1a1a2e";

    const openActionModal = (msg) => {
        Vibration.vibrate(50);
        if (isKeyboardOpen.current) Keyboard.dismiss();
        setSelectedMsg(msg);
        Animated.timing(actionAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };

    const closeActionModal = () => {
        Animated.timing(actionAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setSelectedMsg(null);
        });
    };

    // Handle Keyboard
    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const s1 = Keyboard.addListener(showEvt, (e) => {
            isKeyboardOpen.current = true;
            setKbOpen(true);
            setKbHeight(e.endCoordinates.height);
            setShowAttach(false); // Keyboard opens -> hide popup automatically
            Animated.timing(attachAnim, { toValue: 0, duration: 100, useNativeDriver: false }).start();
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        });

        const s2 = Keyboard.addListener(hideEvt, () => {
            isKeyboardOpen.current = false;
            setKbOpen(false);
        });

        return () => { s1.remove(); s2.remove(); };
    }, []);

    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            if (id) setSenderId(id);
        })();
    }, []);

    const fetchMessages = async () => {
        try {
            const { data } = await axios.get(`${API}/messages/${senderId}/${receiverId}`);
            setMessages(data.messages);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
        }
    };

    useEffect(() => {
        if (senderId && receiverId) {
            fetchMessages();
        }
    }, [senderId, receiverId]);

    // Listen for real-time socket messages
    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (newMessage) => {
                // Check if the message belongs to this chat
                if (newMessage.senderId === receiverId || newMessage.senderId === senderId) {
                    setMessages((prev) => [...prev, newMessage]);
                    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
                }
            });
        }
        return () => {
            if (socket) socket.off("newMessage");
        };
    }, [socket, receiverId, senderId]);

    const sendMessage = async () => {
        if (!senderId || !text.trim()) return;
        const msg = text.trim();
        setText("");
        try {
            setSending(true);
            const { data } = await axios.post(`${API}/send-message`, { senderId, receiverId, message: msg });
            if (data.success && data.data) {
                setMessages((prev) => [...prev, data.data]);
            }
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (err) {
            setText(msg);
        } finally {
            setSending(false);
        }
    };

    // Attachment Toggle
    const toggleAttach = () => {
        if (showAttach) {
            // Close popup
            Animated.timing(attachAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
                setShowAttach(false);
            });
        } else {
            // Open popup
            setShowAttach(true);
            if (isKeyboardOpen.current) {
                Keyboard.dismiss(); // Hide keyboard, show popup in its place
            }
            Animated.spring(attachAnim, { toValue: kbHeight || 300, tension: 65, friction: 10, useNativeDriver: false }).start();
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const closeAttach = () => {
        if (showAttach) toggleAttach();
    };

    const handleAttach = async (key) => {
        closeAttach();
        setTimeout(async () => {
            switch (key) {
                case "camera":
                    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
                    if (!camPerm.granted) return Alert.alert("Permission needed", "Camera access required");
                    const camResult = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                    if (!camResult.canceled) Alert.alert("Photo Captured!", `File ready to send`);
                    break;
                case "gallery":
                    const galPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!galPerm.granted) return Alert.alert("Permission needed", "Gallery access required");
                    const galResult = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.All,
                        quality: 0.8,
                        allowsMultipleSelection: true,
                    });
                    if (!galResult.canceled) {
                        const count = galResult.assets?.length || 1;
                        Alert.alert("Selected!", `${count} file(s) ready to send`);
                    }
                    break;
                case "document":
                    const docResult = await DocumentPicker.getDocumentAsync({ type: "*/*", multiple: true });
                    if (!docResult.canceled) {
                        const count = docResult.assets?.length || 1;
                        Alert.alert("Selected!", `${count} document(s) ready to send`);
                    }
                    break;
                case "audio":
                    const audioResult = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
                    if (!audioResult.canceled) Alert.alert("Selected!", "Audio file ready to send");
                    break;
                case "location":
                    Alert.alert("Location", "Location sharing coming soon!");
                    break;
            }
        }, 250); // wait for anim to close
    };

    const formatTime = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const hasText = text.trim().length > 0;

    const MessageBubble = ({ item }) => {
        const isMe = item.senderId === senderId;
        return (
            <TouchableOpacity
                style={[s.bubbleWrap, isMe ? s.bubbleRight : s.bubbleLeft]}
                onLongPress={() => openActionModal(item)}
                activeOpacity={0.8}
            >
                <View style={[s.bubble, isMe ? { backgroundColor: myBubble, borderBottomRightRadius: 4 } : { backgroundColor: otherBubble, borderBottomLeftRadius: 4 }]}>
                    <Text style={[s.bubbleTxt, isMe ? { color: myBubbleTxt } : { color: otherBubbleTxt }]}>{item.message}</Text>
                </View>
                <Text style={[s.timeTxt, isMe && { textAlign: "right" }]}>{formatTime(item.createdAt)}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                enabled={Platform.OS === "ios"}
            >
                {/* Header */}
                <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={textMain} />
                    </TouchableOpacity>
                    <View style={[s.avatar, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
                        {user?.profilePic ? (
                            <Image source={{ uri: user.profilePic }} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
                        ) : (
                            <Text style={s.avatarTxt}>{userName?.charAt(0)?.toUpperCase()}</Text>
                        )}
                    </View>
                    <View style={s.headerInfo}>
                        <Text style={[s.headerName, { color: textMain }]} numberOfLines={1}>{userName}</Text>
                        <Text style={[s.headerStatus, { color: isOnline ? "#2ecc71" : textSub }]}>
                            {isOnline ? "Online" : "Offline"}
                        </Text>
                    </View>
                    <View style={s.headerActions}>
                        <TouchableOpacity style={[s.headerIconBtn, { backgroundColor: isDark ? "#2a3942" : "#f5f5f5" }]}>
                            <Ionicons name="videocam-outline" size={22} color={textMain} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.headerIconBtn, { backgroundColor: isDark ? "#2a3942" : "#f5f5f5" }]}>
                            <Ionicons name="call-outline" size={20} color={textMain} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages */}
                <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); closeAttach(); }}>
                    {loading ? (
                        <View style={s.loaderWrap}>
                            <ActivityIndicator size="large" color={textMain} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatRef}
                            data={messages}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => <MessageBubble item={item} />}
                            contentContainerStyle={s.msgList}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={s.emptyWrap}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={48} color={border} />
                                    <Text style={[s.emptyTxt, { color: textSub }]}>No messages yet</Text>
                                    <Text style={[s.emptySub, { color: textSub }]}>Say hello! 👋</Text>
                                </View>
                            }
                        />
                    )}
                </Pressable>

                {/* Input Bar */}
                <View style={[s.inputBar, { backgroundColor: headerBg, borderTopColor: border }, kbOpen && Platform.OS === 'android' && { paddingBottom: 25 }]}>
                    <TouchableOpacity style={[s.plusBtn, showAttach && s.plusBtnActive, { backgroundColor: isDark ? "#2a3942" : "#f5f5f5" }]} onPress={toggleAttach}>
                        <Ionicons name={showAttach ? "close" : "add"} size={22} color={showAttach ? textMain : textMain} />
                    </TouchableOpacity>

                    <View style={[s.inputBox, { backgroundColor: surface }]}>
                        <TextInput
                            style={[s.input, { color: textMain }]}
                            placeholder="Type a message..."
                            placeholderTextColor={textSub}
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={500}
                            onFocus={() => {
                                if (showAttach) closeAttach();
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.actionBtn, hasText && s.actionBtnActive, { backgroundColor: hasText ? myBubble : (isDark ? "#2a3942" : "#f5f5f5") }]}
                        onPress={hasText ? sendMessage : undefined}
                        disabled={sending}
                        activeOpacity={0.7}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : hasText ? (
                            <Ionicons name="send" size={16} color="#fff" />
                        ) : (
                            <Ionicons name="mic-outline" size={20} color={textSub} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Attachment Panel (Replaces Keyboard visually) */}
                <Animated.View style={[s.attachPanel, { height: attachAnim, backgroundColor: headerBg }]}>
                    {showAttach && (
                        <View style={s.attachGrid}>
                            {ATTACH_OPTIONS.map((opt) => (
                                <TouchableOpacity key={opt.key} style={s.attachItem} onPress={() => handleAttach(opt.key)} activeOpacity={0.7}>
                                    <View style={[s.attachIconWrap, { backgroundColor: opt.color + "15" }]}>
                                        <Ionicons name={opt.icon} size={28} color={opt.color} />
                                    </View>
                                    <Text style={[s.attachLabel, { color: textMain }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animated.View>

                {/* Message Action Modal */}
                <Modal visible={!!selectedMsg} transparent animationType="none" onRequestClose={closeActionModal}>
                    <View style={s.modalOverlayWrap}>
                        <Animated.View style={[s.modalBackdrop, { opacity: actionAnim }]} />
                        <Pressable style={s.modalDismiss} onPress={closeActionModal} />

                        <Animated.View style={[s.actionSheet, {
                            backgroundColor: headerBg,
                            transform: [{
                                translateY: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })
                            }]
                        }]}>
                            <View style={s.sheetHandle} />

                            {/* Selected Message Bubble */}
                            <View style={[s.sheetMsgBubble, { backgroundColor: surface }]}>
                                <Text style={[s.sheetMsgText, { color: textMain }]}>{selectedMsg?.message}</Text>
                            </View>

                            {/* React Section */}
                            <Text style={[s.reactTitle, { color: textMain }]}>React</Text>
                            <View style={s.emojiRow}>
                                {['🔥', '🙌', '😭', '🙈', '🙏', '😖'].map((emoji, i) => (
                                    <TouchableOpacity key={i} onPress={closeActionModal}>
                                        <Text style={s.emojiTxt}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Actions */}
                            <TouchableOpacity style={[s.actionRow, { borderBottomColor: border }]} onPress={closeActionModal}>
                                <Text style={[s.actionRowTxt, { color: textMain }]}>Copy</Text>
                                <Ionicons name="copy-outline" size={20} color={textMain} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[s.actionRow, { borderBottomColor: border }]} onPress={closeActionModal}>
                                <Text style={[s.actionRowTxt, { color: textMain }]}>Reply</Text>
                                <Ionicons name="arrow-undo-outline" size={20} color={textMain} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[s.actionRow, { borderBottomColor: border }]} onPress={closeActionModal}>
                                <Text style={[s.actionRowTxt, { color: textMain }]}>Forward</Text>
                                <Ionicons name="arrow-redo-outline" size={20} color={textMain} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[s.actionRow, { borderBottomColor: border }]} onPress={closeActionModal}>
                                <Text style={[s.actionRowTxt, { color: textMain }]}>Delete</Text>
                                <Ionicons name="trash-outline" size={20} color={textMain} />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>

            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: "row", alignItems: "center",
        paddingTop: 52, paddingBottom: 12, paddingHorizontal: 12,
        backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    },
    backBtn: { padding: 4 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", marginLeft: 4,
    },
    avatarTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerName: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
    headerStatus: { fontSize: 12, color: "#2ecc71", marginTop: 1 },
    headerActions: { flexDirection: "row", gap: 4 },
    headerIconBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center",
    },

    loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    msgList: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleWrap: { marginBottom: 8, maxWidth: "78%" },
    bubbleRight: { alignSelf: "flex-end" },
    bubbleLeft: { alignSelf: "flex-start" },
    bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    myBubble: { backgroundColor: "#1a1a2e", borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: "#f0f0f0", borderBottomLeftRadius: 4 },
    bubbleTxt: { fontSize: 15, lineHeight: 20, color: "#1a1a2e" },
    timeTxt: { fontSize: 11, color: "#aaa", marginTop: 3, paddingHorizontal: 4 },

    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
    emptyTxt: { fontSize: 16, fontWeight: "600", color: "#bbb" },
    emptySub: { fontSize: 13, color: "#ccc" },

    inputBar: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 10, paddingVertical: 10,
        backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0",
    },
    plusBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 8,
    },
    plusBtnActive: { backgroundColor: "#1a1a2e" },
    inputBox: {
        flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
        minHeight: 40, maxHeight: 100, justifyContent: "center",
    },
    input: { fontSize: 15, color: "#1a1a2e", padding: 0 },
    actionBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center",
    },
    actionBtnActive: { backgroundColor: "#1a1a2e" },

    attachPanel: {
        backgroundColor: "#fff", overflow: "hidden"
    },
    attachGrid: {
        flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around",
        padding: 20, paddingTop: 30, gap: 15
    },
    attachItem: { alignItems: "center", width: "22%", marginBottom: 20 },
    attachIconWrap: {
        width: 60, height: 60, borderRadius: 30,
        justifyContent: "center", alignItems: "center", marginBottom: 8,
    },
    attachLabel: { fontSize: 12, color: "#555", fontWeight: "500" },

    // Action Modal
    modalOverlayWrap: { flex: 1, justifyContent: "flex-end", paddingBottom: 24 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
    modalDismiss: { flex: 1 },
    actionSheet: {
        backgroundColor: "#fff", borderRadius: 24, marginHorizontal: 16,
        paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd",
        alignSelf: "center", marginBottom: 16,
    },
    sheetMsgBubble: {
        backgroundColor: "#f5f5f5", borderRadius: 16, padding: 12,
        marginBottom: 20, alignSelf: "flex-start", maxWidth: "100%",
    },
    sheetMsgText: { fontSize: 14, color: "#1a1a2e", lineHeight: 20 },
    reactTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
    emojiRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    emojiTxt: { fontSize: 24 },
    actionRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    },
    actionRowTxt: { fontSize: 15, fontWeight: "500", color: "#1a1a2e" },
});
