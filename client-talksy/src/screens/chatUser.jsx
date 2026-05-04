import React, { useEffect, useState, useRef, useCallback, useContext, useMemo } from "react";
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Keyboard, Animated, Pressable, Alert,
    KeyboardAvoidingView, Modal, Vibration, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";

const API = "https://talksy-3py1.onrender.com/api/messages";

export default function ChatUser({ route, navigation }) {
    const { user } = route.params;
    const receiverId = user._id || user.id;
    const userName = user.name || user.username || "User";

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [senderId, setSenderId] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyMsg, setReplyMsg] = useState(null);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const flatRef = useRef(null);
    const typingTimerRef = useRef(null);
    const isTypingRef = useRef(false);
    const actionAnim = useRef(new Animated.Value(0)).current;

    // Typing dots animation
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    const { isDark } = useContext(ThemeContext);
    const { socket, onlineUsers, typingUsers,
        registerMessageHandler, unregisterMessageHandler,
        registerStatusHandler, unregisterStatusHandler,
        registerDeleteHandler, unregisterDeleteHandler,
        registerReadHandler, unregisterReadHandler
    } = useContext(SocketContext);
    const { setCurrentChat, clearUnreadCount } = useContext(ChatContext);

    const isOnline = onlineUsers.includes(receiverId);
    const isReceiverTyping = typingUsers[receiverId] || false;

    // Theme colors
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

    // ─── Typing dots animation ───
    useEffect(() => {
        if (!isReceiverTyping) return;
        const animate = (dot, delay) =>
            Animated.loop(Animated.sequence([
                Animated.delay(delay),
                Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
                Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]));
        const a1 = animate(dot1, 0); const a2 = animate(dot2, 150); const a3 = animate(dot3, 300);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); dot1.setValue(0); dot2.setValue(0); dot3.setValue(0); };
    }, [isReceiverTyping]);

    // ─── Init sender ID & mark current chat ───
    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            if (id) setSenderId(id);
        })();
        setCurrentChat(receiverId);
        clearUnreadCount(receiverId);
        return () => { setCurrentChat(null); };
    }, []);

    // ─── Fetch messages ───
    const fetchMessages = async (pg = 1, append = false) => {
        try {
            if (pg > 1) setLoadingMore(true);
            const { data } = await axios.get(`${API}/messages/${senderId}/${receiverId}?page=${pg}&limit=50`);
            if (data.success) {
                if (append) {
                    setMessages(prev => [...data.messages, ...prev]);
                } else {
                    setMessages(data.messages);
                }
                setHasMore(data.pagination?.hasMore || false);
                setPage(pg);
            }
        } catch (err) { console.log(err); }
        finally { setLoading(false); setLoadingMore(false); }
    };

    useEffect(() => { if (senderId && receiverId) fetchMessages(); }, [senderId, receiverId]);

    // ─── Register socket handlers ───
    useEffect(() => {
        registerMessageHandler((msg) => {
            if (msg.senderId === receiverId) {
                setMessages(prev => [...prev, msg]);
                // Mark as read immediately since we're viewing this chat
                if (socket) {
                    socket.emit("message_read", { messageIds: [msg._id], senderId: msg.senderId });
                }
                setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
            }
        });
        registerStatusHandler((msgId, status) => {
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, status } : m));
        });
        registerDeleteHandler((msgId, forEveryone) => {
            if (forEveryone) {
                setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, message: "This message was deleted" } : m));
            } else {
                setMessages(prev => prev.filter(m => m._id !== msgId));
            }
        });
        registerReadHandler((msgIds, status) => {
            setMessages(prev => prev.map(m => msgIds.includes(m._id) ? { ...m, status } : m));
        });
        return () => { unregisterMessageHandler(); unregisterStatusHandler(); unregisterDeleteHandler(); unregisterReadHandler(); };
    }, [receiverId, socket]);

    // ─── Mark existing unread messages as read on open ───
    const hasMarkedRead = useRef(false);
    useEffect(() => {
        if (senderId && messages.length > 0 && socket && !hasMarkedRead.current) {
            hasMarkedRead.current = true;
            const unreadIds = messages
                .filter(m => m.senderId === receiverId && m.status !== "read")
                .map(m => m._id);
            if (unreadIds.length > 0) {
                socket.emit("message_read", { messageIds: unreadIds, senderId: receiverId });
                setMessages(prev => prev.map(m => unreadIds.includes(m._id) ? { ...m, status: "read" } : m));
            }
        }
    }, [senderId, messages, socket]);

    // ─── Typing emit with debounce ───
    const handleTextChange = (val) => {
        setText(val);
        if (!socket) return;
        if (!isTypingRef.current && val.trim()) {
            isTypingRef.current = true;
            socket.emit("typing_start", { senderId, receiverId });
        }
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            if (isTypingRef.current) {
                isTypingRef.current = false;
                socket.emit("typing_stop", { senderId, receiverId });
            }
        }, 2000);
    };

    // ─── Send message ───
    const sendMessage = async () => {
        if (!senderId || !text.trim()) return;
        const msg = text.trim();
        setText("");
        // Stop typing
        if (isTypingRef.current && socket) {
            isTypingRef.current = false;
            socket.emit("typing_stop", { senderId, receiverId });
        }
        clearTimeout(typingTimerRef.current);

        try {
            setSending(true);
            const payload = { senderId, receiverId, message: msg };
            if (replyMsg) payload.replyTo = replyMsg._id;
            const { data } = await axios.post(`${API}/send-message`, payload);
            if (data.success && data.data) {
                setMessages(prev => [...prev, data.data]);
                setReplyMsg(null);
            }
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (err) { setText(msg); }
        finally { setSending(false); }
    };

    // ─── Load older messages ───
    const loadOlderMessages = () => {
        if (!hasMore || loadingMore) return;
        fetchMessages(page + 1, true);
    };

    // ─── Action modal ───
    const openActionModal = (msg) => {
        Vibration.vibrate(50);
        setSelectedMsg(msg);
        Animated.timing(actionAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };
    const closeActionModal = () => {
        Animated.timing(actionAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSelectedMsg(null));
    };

    // ─── Copy message ───
    const handleCopy = async () => {
        if (selectedMsg?.message) {
            await Clipboard.setStringAsync(selectedMsg.message);
        }
        closeActionModal();
    };

    // ─── Reply ───
    const handleReply = () => { setReplyMsg(selectedMsg); closeActionModal(); };

    // ─── Delete ───
    const handleDelete = () => {
        closeActionModal();
        const isMe = selectedMsg?.senderId === senderId;
        setTimeout(() => {
            const options = [{ text: "Cancel", style: "cancel" }];
            options.push({
                text: "Delete for me", onPress: () => {
                    if (socket) socket.emit("delete_message", { messageId: selectedMsg._id, userId: senderId, deleteForEveryone: false });
                    setMessages(prev => prev.filter(m => m._id !== selectedMsg._id));
                }
            });
            if (isMe) {
                options.push({
                    text: "Delete for everyone", style: "destructive", onPress: () => {
                        if (socket) socket.emit("delete_message", { messageId: selectedMsg._id, userId: senderId, deleteForEveryone: true });
                        setMessages(prev => prev.map(m => m._id === selectedMsg._id ? { ...m, isDeleted: true, message: "This message was deleted" } : m));
                    }
                });
            }
            Alert.alert("Delete Message", "Choose an option", options);
        }, 300);
    };

    const formatTime = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // ─── Status ticks component ───
    const StatusTicks = ({ status }) => {
        if (status === "read") return <Ionicons name="checkmark-done" size={16} color="#53bdeb" />;
        if (status === "delivered") return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.6)" />;
        return <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.6)" />;
    };

    const hasText = text.trim().length > 0;

    // ─── Message Bubble ───
    const MessageBubble = useCallback(({ item }) => {
        const isMe = item.senderId === senderId;
        const deleted = item.isDeleted;

        return (
            <TouchableOpacity
                style={[s.bubbleWrap, isMe ? s.bubbleRight : s.bubbleLeft]}
                onLongPress={() => !deleted && openActionModal(item)}
                activeOpacity={0.8}
                disabled={deleted}
            >
                {/* Reply reference */}
                {item.replyToMessage && !deleted && (
                    <View style={[s.replyRef, { backgroundColor: isMe ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderLeftColor: isMe ? "#53bdeb" : "#25D366" }]}>
                        <Text style={[s.replyRefName, { color: isMe ? "#53bdeb" : "#25D366" }]}>
                            {item.replyToMessage.senderId === senderId ? "You" : userName}
                        </Text>
                        <Text style={[s.replyRefTxt, { color: isMe ? "rgba(255,255,255,0.7)" : textSub }]} numberOfLines={1}>
                            {item.replyToMessage.isDeleted ? "This message was deleted" : item.replyToMessage.message}
                        </Text>
                    </View>
                )}
                <View style={[s.bubble, isMe ? { backgroundColor: myBubble, borderBottomRightRadius: 4 } : { backgroundColor: otherBubble, borderBottomLeftRadius: 4 }]}>
                    {deleted ? (
                        <Text style={[s.deletedTxt, { color: isMe ? "rgba(255,255,255,0.5)" : textSub }]}>🚫 This message was deleted</Text>
                    ) : (
                        <Text style={[s.bubbleTxt, isMe ? { color: myBubbleTxt } : { color: otherBubbleTxt }]}>{item.message}</Text>
                    )}
                    <View style={s.metaRow}>
                        <Text style={[s.timeTxt, { color: isMe ? "rgba(255,255,255,0.5)" : "#aaa" }]}>{formatTime(item.createdAt)}</Text>
                        {isMe && !deleted && <View style={{ marginLeft: 4 }}><StatusTicks status={item.status} /></View>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [senderId, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, textSub, userName]);

    // ─── Typing dots indicator in chat body ───
    const TypingBubble = () => (
        <View style={[s.bubbleWrap, s.bubbleLeft]}>
            <View style={[s.bubble, { backgroundColor: otherBubble, flexDirection: "row", paddingHorizontal: 18, paddingVertical: 14 }]}>
                {[dot1, dot2, dot3].map((d, i) => (
                    <Animated.View key={i} style={[s.typingDot, { backgroundColor: textSub, transform: [{ translateY: d }], marginHorizontal: 3 }]} />
                ))}
            </View>
        </View>
    );

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled={Platform.OS === "ios"}>
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
                        <Text style={[s.headerStatus, { color: isReceiverTyping ? "#25D366" : isOnline ? "#2ecc71" : textSub }]}>
                            {isReceiverTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
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
                <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
                    {loading ? (
                        <View style={s.loaderWrap}><ActivityIndicator size="large" color={textMain} /></View>
                    ) : (
                        <FlatList
                            ref={flatRef}
                            data={messages}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => <MessageBubble item={item} />}
                            contentContainerStyle={s.msgList}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => page === 1 && flatRef.current?.scrollToEnd({ animated: false })}
                            keyboardShouldPersistTaps="handled"
                            onScroll={({ nativeEvent }) => {
                                if (nativeEvent.contentOffset.y < 50 && hasMore && !loadingMore) {
                                    loadOlderMessages();
                                }
                            }}
                            scrollEventThrottle={400}
                            ListHeaderComponent={loadingMore ? <ActivityIndicator size="small" color={textSub} style={{ marginVertical: 10 }} /> : null}
                            ListFooterComponent={isReceiverTyping ? <TypingBubble /> : null}
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

                {/* Reply Preview */}
                {replyMsg && (
                    <View style={[s.replyBar, { backgroundColor: headerBg, borderTopColor: border }]}>
                        <View style={s.replyBarContent}>
                            <View style={[s.replyBarLine, { backgroundColor: "#25D366" }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.replyBarName, { color: "#25D366" }]}>
                                    {replyMsg.senderId === senderId ? "You" : userName}
                                </Text>
                                <Text style={[s.replyBarTxt, { color: textSub }]} numberOfLines={1}>{replyMsg.message}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setReplyMsg(null)} style={{ padding: 8 }}>
                            <Ionicons name="close" size={20} color={textSub} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input Bar */}
                <View style={[s.inputBar, { backgroundColor: headerBg, borderTopColor: border }]}>
                    <View style={[s.inputBox, { backgroundColor: surface }]}>
                        <TextInput
                            style={[s.input, { color: textMain }]}
                            placeholder="Type a message..."
                            placeholderTextColor={textSub}
                            value={text}
                            onChangeText={handleTextChange}
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <TouchableOpacity
                        style={[s.actionBtn, hasText && { backgroundColor: myBubble }]}
                        onPress={hasText ? sendMessage : undefined}
                        disabled={sending}
                        activeOpacity={0.7}
                    >
                        {sending ? <ActivityIndicator size="small" color="#fff" /> :
                            hasText ? <Ionicons name="send" size={16} color="#fff" /> :
                                <Ionicons name="mic-outline" size={20} color={textSub} />}
                    </TouchableOpacity>
                </View>

                {/* Action Modal */}
                <Modal visible={!!selectedMsg} transparent animationType="none" onRequestClose={closeActionModal}>
                    <View style={s.modalOverlayWrap}>
                        <Animated.View style={[s.modalBackdrop, { opacity: actionAnim }]} />
                        <Pressable style={s.modalDismiss} onPress={closeActionModal} />
                        <Animated.View style={[s.actionSheet, {
                            backgroundColor: headerBg,
                            transform: [{ translateY: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }]
                        }]}>
                            <View style={s.sheetHandle} />
                            <View style={[s.sheetMsgBubble, { backgroundColor: surface }]}>
                                <Text style={[s.sheetMsgText, { color: textMain }]}>{selectedMsg?.message}</Text>
                            </View>
                            {[
                                { label: "Copy", icon: "copy-outline", action: handleCopy },
                                { label: "Reply", icon: "arrow-undo-outline", action: handleReply },
                                { label: "Delete", icon: "trash-outline", action: handleDelete },
                            ].map((opt, i) => (
                                <TouchableOpacity key={i} style={[s.actionRow, { borderBottomColor: border }]} onPress={opt.action}>
                                    <Text style={[s.actionRowTxt, { color: opt.label === "Delete" ? "#e74c3c" : textMain }]}>{opt.label}</Text>
                                    <Ionicons name={opt.icon} size={20} color={opt.label === "Delete" ? "#e74c3c" : textMain} />
                                </TouchableOpacity>
                            ))}
                        </Animated.View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginLeft: 4 },
    avatarTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerName: { fontSize: 17, fontWeight: "700" },
    headerStatus: { fontSize: 12, marginTop: 1 },
    headerActions: { flexDirection: "row", gap: 4 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    msgList: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleWrap: { marginBottom: 6, maxWidth: "78%" },
    bubbleRight: { alignSelf: "flex-end" },
    bubbleLeft: { alignSelf: "flex-start" },
    bubble: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, borderRadius: 18 },
    bubbleTxt: { fontSize: 15, lineHeight: 20 },
    deletedTxt: { fontSize: 14, fontStyle: "italic" },
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 2 },
    timeTxt: { fontSize: 11 },
    // Reply reference inside bubble
    replyRef: { borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4 },
    replyRefName: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
    replyRefTxt: { fontSize: 13 },
    // Reply bar above input
    replyBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
    replyBarContent: { flex: 1, flexDirection: "row", alignItems: "center" },
    replyBarLine: { width: 3, height: "100%", borderRadius: 2, marginRight: 10 },
    replyBarName: { fontSize: 13, fontWeight: "700" },
    replyBarTxt: { fontSize: 13 },
    // Typing dots
    typingDot: { width: 8, height: 8, borderRadius: 4 },
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
    emptyTxt: { fontSize: 16, fontWeight: "600" },
    emptySub: { fontSize: 13 },
    inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1 },
    inputBox: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, minHeight: 40, maxHeight: 100, justifyContent: "center" },
    input: { fontSize: 15, padding: 0 },
    actionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center" },
    modalOverlayWrap: { flex: 1, justifyContent: "flex-end", paddingBottom: 24 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
    modalDismiss: { flex: 1 },
    actionSheet: { borderRadius: 24, marginHorizontal: 16, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16 },
    sheetMsgBubble: { borderRadius: 16, padding: 12, marginBottom: 20, alignSelf: "flex-start", maxWidth: "100%" },
    sheetMsgText: { fontSize: 14, lineHeight: 20 },
    actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
    actionRowTxt: { fontSize: 15, fontWeight: "500" },
});
