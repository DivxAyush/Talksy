import React, { useEffect, useState, useRef, useCallback, useContext, useMemo } from "react";
import {
 View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
 Platform, ActivityIndicator, Keyboard, Animated, Pressable, Alert,
 KeyboardAvoidingView, Modal, Vibration, Image, Dimensions, PanResponder, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { Audio, Video, ResizeMode } from "expo-av";
import { ThemeContext } from "../context/ThemeContext";
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const API = "https://talksy-3py1.onrender.com/api/messages";

export default function ChatUser({ route, navigation }) {
 const { user } = route.params;
 const receiverId = user._id || user.id;

 // Reactive profile data (updates via socket)
 const [displayName, setDisplayName] = useState(user.name || user.username || "User");
 const [displayPic, setDisplayPic] = useState(user.profilePic || "");

 const [audioPlayer, setAudioPlayer] = useState({
  messageId: null,
  url: null,
  isPlaying: false,
  progress: 0,
  duration: 1
 });
 const videoRef = useRef(null);
 const [messages, setMessages] = useState([]);
 const [text, setText] = useState("");
 const textRef = useRef("");
 const [senderId, setSenderId] = useState("");
 const senderIdRef = useRef("");
 const [loading, setLoading] = useState(true);
 const [sending, setSending] = useState(false);
 const [replyMsg, setReplyMsg] = useState(null);
 const [selectedMsg, setSelectedMsg] = useState(null);
 const [page, setPage] = useState(1);
 const [barWidth, setBarWidth] = useState(1);
 const [hasMore, setHasMore] = useState(false);
 const [loadingMore, setLoadingMore] = useState(false);
 const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // { messageId, sound, progress: 0-100 }

 // Profile popup state
 const [popupVisible, setPopupVisible] = useState(false);
 const popupAnim = useRef(new Animated.Value(0)).current;

 // Media states
 const [showAttachMenu, setShowAttachMenu] = useState(false);
 const [uploadingMedia, setUploadingMedia] = useState({}); // { tempId: { progress, type } }
 const [mediaViewer, setMediaViewer] = useState(null); // { type, url, caption }

 // Voice recording states
 const [isRecording, setIsRecording] = useState(false);
 const isRecordingRef = useRef(false);
 const [recordDuration, setRecordDuration] = useState(0);
 const recordingRef = useRef(null);
 const recordTimerRef = useRef(null);
 const recordSlideAnim = useRef(new Animated.Value(0)).current;
 const attachAnim = useRef(new Animated.Value(0)).current;

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
  registerReadHandler, unregisterReadHandler,
  registerProfileUpdateHandler, unregisterProfileUpdateHandler
 } = useContext(SocketContext);
 const { setCurrentChat, clearUnreadCount, getCachedMessages, setCachedMessages, addMessageToCache } = useContext(ChatContext);

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
 const accentPurple = "#a855f7";

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
   if (id) {
    setSenderId(id);
    senderIdRef.current = id;
   }
  })();
  setCurrentChat(receiverId);
  clearUnreadCount(receiverId);
  return () => { setCurrentChat(null); };
 }, []);

 // ─── Fetch messages (with cache support) ───
 const fetchMessages = async (pg = 1, append = false) => {
  try {
   // On first load, check cache
   if (pg === 1 && !append && senderId) {
    const cached = getCachedMessages(senderId, receiverId);
    if (cached && cached.messages.length > 0 && (Date.now() - cached.lastFetchTime) < 60000) {
     setMessages(cached.messages);
     setHasMore(cached.hasMore);
     setPage(cached.page);
     setLoading(false);
     return;
    }
   }

   if (pg > 1) setLoadingMore(true);
   const { data } = await axios.get(`${API}/messages/${senderId}/${receiverId}?page=${pg}&limit=50`);
   if (data.success) {
    const reversed = data.messages.reverse();
    if (append) {
     setMessages(prev => [...prev, ...reversed]);
    } else {
     setMessages(reversed);
     // Cache the messages
     setCachedMessages(senderId, receiverId, {
      messages: reversed,
      page: pg,
      hasMore: data.pagination?.hasMore || false,
     });
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
    setMessages(prev => [msg, ...prev]);
    // Mark as read immediately since we're viewing this chat
    if (socket) {
     socket.emit("message_read", { messageIds: [msg._id], senderId: msg.senderId });
    }
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

 // ─── Profile update handler (real-time) ───
 useEffect(() => {
  registerProfileUpdateHandler((data) => {
   if (data.userId === receiverId) {
    if (data.name) setDisplayName(data.name);
    if (data.profilePic !== undefined) setDisplayPic(data.profilePic);
   }
  });
  return () => { unregisterProfileUpdateHandler(); };
 }, [receiverId]);

 // ─── Media & Voice Logic ───
 const toggleAttachMenu = () => {
  setShowAttachMenu(!showAttachMenu);
  Animated.spring(attachAnim, { toValue: showAttachMenu ? 0 : 1, useNativeDriver: true }).start();
 };

 const pickImage = async () => {
  toggleAttachMenu();
  const result = await ImagePicker.launchImageLibraryAsync({
   mediaTypes: ImagePicker.MediaTypeOptions.Images,
   allowsEditing: true, quality: 0.7,
  });
  if (!result.canceled) handleMediaUpload(result.assets[0], "image");
 };

 const pickVideo = async () => {
  toggleAttachMenu();
  const result = await ImagePicker.launchImageLibraryAsync({
   mediaTypes: ImagePicker.MediaTypeOptions.Videos,
   allowsEditing: true, quality: 0.7,
  });
  if (!result.canceled) handleMediaUpload(result.assets[0], "video");
 };

 const handleMediaUpload = async (asset, type) => {
  const tempId = Date.now().toString();
  setUploadingMedia(prev => ({ ...prev, [tempId]: { progress: 0.1, type, uri: asset.uri } }));

  try {
   const uriParts = asset.uri.split(".");
   const ext = uriParts[uriParts.length - 1];
   const mime =
    type === "image" ? "image/jpeg" :
     type === "video" ? "video/mp4" :
      type === "voice" ? "audio/m4a" :
       "application/octet-stream";

   const formData = new FormData();
   formData.append("file", {
    uri: asset.uri,
    name: `media_${tempId}.${ext}`,
    type: mime
   });

   const { data } = await axios.post("https://talksy-3py1.onrender.com/api/messages/upload-media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (p) => {
     setUploadingMedia(prev => ({
      ...prev,
      [tempId]: { ...prev[tempId], progress: p.loaded / p.total }
     }));
    }
   });

   if (data.success) {
    await sendMediaMessage(data.data.url, type, data.data);
   }
  } catch (err) {
   console.log("Upload failed", err);
   Alert.alert("Error", "Failed to upload media");
  } finally {
   setUploadingMedia(prev => {
    const next = { ...prev };
    delete next[tempId];
    return next;
   });
  }
 };

 const sendMediaMessage = async (url, type, metadata) => {
  const sid = senderIdRef.current || senderId;
  if (!sid) {
   console.log("Cannot send: senderId is missing");
   return;
  }

  try {
   const payload = {
    senderId: sid,
    receiverId,
    messageType: type,
    mediaUrl: url,
    mediaSize: metadata?.size || 0,
    mediaDuration: metadata?.duration || 0,
    mediaThumbnail: metadata?.thumbnail || "",
    replyTo: replyMsg?._id
   };
   const { data } = await axios.post(`${API}/send-message`, payload);
   if (data.success) {
    setMessages(prev => [data.data, ...prev]);
    addMessageToCache(sid, receiverId, data.data);
    setReplyMsg(null);
   }
  } catch (err) {
   console.log("Send media message failed:", err.response?.data || err.message);
  }
 };

 // ─── Voice Recording Logic ───
 const startRecording = async () => {
  if (recordingRef.current || isRecordingRef.current) return;

  try {
   const permission = await Audio.requestPermissionsAsync();
   if (permission.status !== "granted") return;

   await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false
   });

   const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
   recordingRef.current = recording;
   isRecordingRef.current = true;
   setIsRecording(true);
   setRecordDuration(0);
   recordTimerRef.current = setInterval(() => setRecordDuration(prev => prev + 1), 1000);
   Vibration.vibrate(50);
  } catch (err) {
   console.log("Failed to start recording", err);
   isRecordingRef.current = false;
   setIsRecording(false);
   recordingRef.current = null;
  }
 };

 const stopRecording = async (shouldSend = true) => {
  if (!recordingRef.current) {
   isRecordingRef.current = false;
   setIsRecording(false);
   return;
  }

  const recording = recordingRef.current;
  recordingRef.current = null;
  isRecordingRef.current = false;
  setIsRecording(false);
  clearInterval(recordTimerRef.current);

  try {
   await recording.stopAndUnloadAsync();
   const uri = recording.getURI();
   if (shouldSend && uri) {
    handleMediaUpload({ uri }, "voice");
   }
  } catch (err) {
   console.log("Stop recording error:", err);
  }
 };

 const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
 };

 const playSound = (messageId, url) => {
  if (audioPlayer.messageId === messageId) {
   if (!audioPlayer.isPlaying && audioPlayer.progress >= audioPlayer.duration - 100) {
    videoRef.current?.setPositionAsync(0);
   }
   setAudioPlayer(prev => ({
    ...prev,
    isPlaying: !prev.isPlaying
   }));
   return;
  }

  setAudioPlayer({
   messageId,
   url,
   isPlaying: true,
   progress: 0,
   duration: 1
  });
 };

 useEffect(() => {
  return () => { if (currentlyPlaying) currentlyPlaying.sound.unloadAsync(); };
 }, [currentlyPlaying]);

 const callbacksRef = useRef({});
 const panResponder = useRef(
  PanResponder.create({
   onStartShouldSetPanResponder: () => true,
   onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
   onPanResponderGrant: () => {
    if (!textRef.current.trim()) {
     callbacksRef.current.startRecording();
    }
   },
   onPanResponderMove: (_, gesture) => {
    if (isRecordingRef.current && gesture.dx < 0) {
     recordSlideAnim.setValue(gesture.dx);
     if (gesture.dx < -120) {
      callbacksRef.current.stopRecording(false);
      Vibration.vibrate(30);
      recordSlideAnim.setValue(0);
     }
    }
   },
   onPanResponderRelease: () => {
    if (textRef.current.trim()) {
     callbacksRef.current.sendMessage();
    } else if (isRecordingRef.current || recordingRef.current) {
     callbacksRef.current.stopRecording(true);
    }
    Animated.spring(recordSlideAnim, { toValue: 0, useNativeDriver: true }).start();
   },
   onPanResponderTerminate: () => {
    if (isRecordingRef.current || recordingRef.current) callbacksRef.current.stopRecording(false);
    recordSlideAnim.setValue(0);
   }
  })
 ).current;

 useEffect(() => {
  return () => {
   if (recordingRef.current) {
    recordingRef.current.stopAndUnloadAsync().catch(() => { });
    clearInterval(recordTimerRef.current);
   }
   if (currentlyPlaying) {
    currentlyPlaying.sound.unloadAsync().catch(() => { });
   }
  };
 }, []);

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
  textRef.current = val;
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
  const currentText = textRef.current || text;
  if (!senderId || !currentText.trim()) return;
  const msg = currentText.trim();
  setText("");
  textRef.current = "";
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
    setMessages(prev => [data.data, ...prev]);
    addMessageToCache(senderId, receiverId, data.data);
    setReplyMsg(null);
   }
  } catch (err) { setText(msg); textRef.current = msg; }
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
  const isMedia = item.messageType && item.messageType !== "text";

  return (
   <TouchableOpacity
    style={[s.bubbleWrap, isMe ? s.bubbleRight : s.bubbleLeft]}
    onLongPress={() => !deleted && openActionModal(item)}
    onPress={() => {
     if (isMedia && !deleted) {
      if (item.messageType === "image" || item.messageType === "video") {
       setMediaViewer({ type: item.messageType, url: item.mediaUrl, caption: item.message });
      } else if (item.messageType === "voice") {
       playSound(item._id, item.mediaUrl);
      }
     }
    }}
    activeOpacity={0.8}
    disabled={deleted && !isMedia}
   >
    {/* Reply reference */}
    {item.replyToMessage && !deleted && (
     <View style={[s.replyRef, { backgroundColor: isMe ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderLeftColor: isMe ? "#53bdeb" : "#25D366" }]}>
      <Text style={[s.replyRefName, { color: isMe ? "#53bdeb" : "#25D366" }]}>
       {item.replyToMessage.senderId === senderId ? "You" : displayName}
      </Text>
      <Text style={[s.replyRefTxt, { color: isMe ? "rgba(255,255,255,0.7)" : textSub }]} numberOfLines={1}>
       {item.replyToMessage.isDeleted ? "This message was deleted" : item.replyToMessage.message}
      </Text>
     </View>
    )}

    <View style={[
     s.bubble,
     isMe ? { backgroundColor: myBubble, borderBottomRightRadius: 4 } : { backgroundColor: otherBubble, borderBottomLeftRadius: 4 },
     isMedia && { padding: 4, borderRadius: 12 }
    ]}>
     {deleted ? (
      <Text style={[s.deletedTxt, { color: isMe ? "rgba(255,255,255,0.5)" : textSub }, { paddingHorizontal: 10, paddingVertical: 4 }]}>
       🚫 This message was deleted
      </Text>
     ) : (
      <>
       {item.messageType === "image" && (
        <View style={s.mediaContainer}>
         <Image source={{ uri: item.mediaUrl }} style={s.bubbleImage} />
        </View>
       )}
       {item.messageType === "video" && (
        <View style={s.mediaContainer}>
         <Image source={{ uri: item.mediaThumbnail || item.mediaUrl }} style={s.bubbleImage} />
         <View style={s.playOverlay}>
          <Ionicons name="play" size={32} color="#fff" />
         </View>
        </View>
       )}
       {item.messageType === "voice" && (
        <View style={s.voiceBubble}>
         <View>
          <Ionicons name={audioPlayer.messageId === item._id && audioPlayer.isPlaying ? "pause" : "play"}
           size={28} color={isMe ? "#fff" : accentPurple}
          />
         </View>
         <View style={s.voiceWaveform}>
          <TouchableOpacity
           activeOpacity={1}
           onPress={(e) => {
            if (audioPlayer.messageId !== item._id) return;

            const { locationX } = e.nativeEvent;
            const percent = locationX / e.nativeEvent.target.layout?.width || 200;

            const newPosition = percent * audioPlayer.duration;

            videoRef.current?.setPositionAsync(newPosition);
           }}
           style={{ width: "100%" }}
          >
           <View style={[s.voiceBar, { backgroundColor: isMe ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)", width: "100%" }]}
           >
            <View
             style={[
              s.voiceProgress,
              {
               backgroundColor: isMe ? "#fff" : accentPurple,
               width:
                audioPlayer.messageId === item._id
                 ? `${(audioPlayer.progress / audioPlayer.duration) * 100}%`
                 : "0%"
              }
             ]}
            />
           </View>
          </TouchableOpacity>
         </View>
         <Text style={[s.voiceDuration, { color: isMe ? "#fff" : textSub }]}>
          {formatDuration(item.mediaDuration || 0)}
         </Text>
        </View>
       )}

       {item.message ? (
        <Text style={[s.bubbleTxt, isMe ? { color: myBubbleTxt } : { color: otherBubbleTxt }, isMedia && { paddingHorizontal: 8, paddingVertical: 4 }]}>
         {item.message}
        </Text>
       ) : null}
      </>
     )}

     <View style={[s.metaRow, isMedia && { paddingHorizontal: 8, paddingBottom: 4 }]}>
      <Text style={[s.timeTxt, { color: isMe ? "rgba(255,255,255,0.5)" : "#aaa" }]}>{formatTime(item.createdAt)}</Text>
      {isMe && !deleted && <View style={{ marginLeft: 4 }}><StatusTicks status={item.status} /></View>}
     </View>
    </View>
   </TouchableOpacity>
  );
 }, [senderId, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, textSub, displayName, audioPlayer]);

 // ─── Typing dots indicator ───
 const TypingBubble = () => (
  <View style={[s.bubbleWrap, s.bubbleLeft]}>
   <View style={[s.bubble, { backgroundColor: otherBubble, flexDirection: "row", paddingHorizontal: 18, paddingVertical: 14 }]}>
    {[dot1, dot2, dot3].map((d, i) => (
     <Animated.View key={i} style={[s.typingDot, { backgroundColor: textSub, transform: [{ translateY: d }], marginHorizontal: 3 }]} />
    ))}
   </View>
  </View>
 );

 // ─── Optimistic Uploading Bubble ───
 const UploadingBubble = ({ tempId, data }) => (
  <View style={[s.bubbleWrap, s.bubbleRight]}>
   <View style={[s.bubble, { backgroundColor: myBubble, padding: 4, borderRadius: 12 }]}>
    {data.type === "image" || data.type === "video" ? (
     <View style={s.mediaContainer}>
      <Image source={{ uri: data.uri }} style={[s.bubbleImage, { opacity: 0.6 }]} />
      <View style={s.uploadOverlay}>
       <ActivityIndicator size="small" color="#fff" />
       <View style={s.progressBarWrap}>
        <View style={[s.progressBar, { width: `${data.progress * 100}%` }]} />
       </View>
      </View>
     </View>
    ) : (
     <View style={s.voiceBubble}>
      <Ionicons name="mic" size={24} color="#fff" />
      <View style={s.progressBarWrap}>
       <View style={[s.progressBar, { width: `${data.progress * 100}%` }]} />
      </View>
     </View>
    )}
   </View>
  </View>
 );

 callbacksRef.current = { startRecording, stopRecording, sendMessage };

 return (
  <View style={[s.container, { backgroundColor: bg }]}>
   <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior="padding"
   >
    {/* Header */}
    <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
     <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
      <Ionicons name="arrow-back" size={24} color={textMain} />
     </TouchableOpacity>
     <TouchableOpacity
      onPress={() => {
       setPopupVisible(true);
       Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }}
      activeOpacity={0.8}
     >
      <View style={[s.avatar, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
       {displayPic ? (
        <Image source={{ uri: displayPic }} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
       ) : (
        <Text style={s.avatarTxt}>{displayName?.charAt(0)?.toUpperCase()}</Text>
       )}
      </View>
     </TouchableOpacity>
     <View style={s.headerInfo}>
      <Text style={[s.headerName, { color: textMain }]} numberOfLines={1}>{displayName}</Text>
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
    <View style={{ flex: 1 }}>
     {loading ? (
      <View style={s.loaderWrap}><ActivityIndicator size="large" color={textMain} /></View>
     ) : (
      <FlatList
       ref={flatRef}
       data={messages}
       extraData={audioPlayer}
       keyExtractor={(item) => item._id}
       renderItem={({ item }) => <MessageBubble item={item} />}
       contentContainerStyle={s.msgList}
       showsVerticalScrollIndicator={false}
       keyboardDismissMode="on-drag"
       inverted={true}
       keyboardShouldPersistTaps="handled"
       onEndReached={() => {
        if (hasMore && !loadingMore) loadOlderMessages();
       }}
       onEndReachedThreshold={0.5}
       scrollEventThrottle={400}
       ListHeaderComponent={
        <View>
         {isReceiverTyping && <TypingBubble />}
         {Object.entries(uploadingMedia).map(([id, data]) => (
          <UploadingBubble key={id} tempId={id} data={data} />
         ))}
        </View>
       }
       ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={textSub} style={{ marginVertical: 10 }} /> : null}
       ListEmptyComponent={
        <View style={s.emptyWrap}>
         <Ionicons name="chatbubble-ellipses-outline" size={48} color={border} />
         <Text style={[s.emptyTxt, { color: textSub }]}>No messages yet</Text>
         <Text style={[s.emptySub, { color: textSub }]}>Say hello! 👋</Text>
        </View>
       }
      />
     )}
    </View>

    {/* Reply Preview */}
    {replyMsg && (
     <View style={[s.replyBar, { backgroundColor: headerBg, borderTopColor: border }]}>
      <View style={s.replyBarContent}>
       <View style={[s.replyBarLine, { backgroundColor: "#25D366" }]} />
       <View style={{ flex: 1 }}>
        <Text style={[s.replyBarName, { color: "#25D366" }]}>
         {replyMsg.senderId === senderId ? "You" : displayName}
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
     {isRecording ? (
      <View style={s.recordingContainer}>
       <Ionicons name="mic" size={24} color="#e74c3c" />
       <Text style={[s.recordTime, { color: textMain }]}>{formatDuration(recordDuration)}</Text>
       <Animated.View style={[s.slideCancel, { transform: [{ translateX: recordSlideAnim }] }]}>
        <Ionicons name="chevron-back" size={20} color={textSub} />
        <Text style={[s.slideCancelTxt, { color: textSub }]}>Slide to cancel</Text>
       </Animated.View>
      </View>
     ) : (
      <>
       <TouchableOpacity onPress={toggleAttachMenu} style={s.attachBtn}>
        <Ionicons name="add" size={28} color={textSub} />
       </TouchableOpacity>
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
      </>
     )}
     <Animated.View
      {...panResponder.panHandlers}
      style={[
       s.actionBtn,
       (hasText || isRecording) && { backgroundColor: myBubble },
       { transform: [{ translateX: recordSlideAnim }] }
      ]}
     >
      {sending ? (
       <ActivityIndicator size="small" color="#fff" />
      ) : hasText ? (
       <Ionicons name="send" size={18} color="#fff" />
      ) : (
       <Ionicons name="mic" size={22} color={isRecording ? "#fff" : textSub} />
      )}
     </Animated.View>
    </View>

    {/* Attachment Menu */}
    {showAttachMenu && (
     <Animated.View style={[s.attachMenu, {
      backgroundColor: headerBg,
      opacity: attachAnim,
      transform: [{ translateY: attachAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }]
     }]}>
      <TouchableOpacity style={s.attachItem} onPress={pickImage}>
       <View style={[s.attachIcon, { backgroundColor: "#a855f7" }]}>
        <Ionicons name="image" size={24} color="#fff" />
       </View>
       <Text style={[s.attachTxt, { color: textMain }]}>Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.attachItem} onPress={pickVideo}>
       <View style={[s.attachIcon, { backgroundColor: "#ef4444" }]}>
        <Ionicons name="videocam" size={24} color="#fff" />
       </View>
       <Text style={[s.attachTxt, { color: textMain }]}>Video</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.attachItem} onPress={() => Alert.alert("Coming Soon")}>
       <View style={[s.attachIcon, { backgroundColor: "#3b82f6" }]}>
        <Ionicons name="document" size={24} color="#fff" />
       </View>
       <Text style={[s.attachTxt, { color: textMain }]}>Document</Text>
      </TouchableOpacity>
     </Animated.View>
    )}

    {/* Media Viewer Modal */}
    <Modal visible={!!mediaViewer} transparent animationType="fade">
     <View style={s.viewerOverlay}>
      <TouchableOpacity style={s.viewerClose} onPress={() => setMediaViewer(null)}>
       <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
      {mediaViewer?.type === "image" && (
       <Image source={{ uri: mediaViewer.url }} style={s.fullImage} resizeMode="contain" />
      )}
      {mediaViewer?.type === "video" && (
       <Video
        source={{ uri: mediaViewer.url }}
        style={s.fullImage}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay
       />
      )}
      {mediaViewer?.caption && (
       <View style={s.viewerCaption}>
        <Text style={s.viewerCaptionTxt}>{mediaViewer.caption}</Text>
       </View>
      )}
     </View>
    </Modal>

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

   {/* ─── Profile Popup Modal ─── */}
   <Modal visible={popupVisible} transparent animationType="none" onRequestClose={() => {
    Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setPopupVisible(false));
   }}>
    <Pressable style={s.popupOverlay} onPress={() => {
     Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setPopupVisible(false));
    }}>
     <Animated.View style={[s.popupBackdrop, { opacity: popupAnim }]} />
     <Animated.View style={[s.popupCard, {
      backgroundColor: isDark ? "#202c33" : "#fff",
      opacity: popupAnim,
      transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
     }]}>
      {displayPic ? (
       <Image source={{ uri: displayPic }} style={s.popupImage} />
      ) : (
       <View style={[s.popupAvatarPlaceholder, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
        <Text style={s.popupAvatarTxt}>{displayName?.charAt(0)?.toUpperCase()}</Text>
       </View>
      )}

      <Text style={[s.popupName, { color: textMain }]}>{displayName}</Text>
     </Animated.View>
    </Pressable>
   </Modal>
   {audioPlayer.url && (
    <Video
     ref={videoRef}
     key={audioPlayer.messageId}
     source={{ uri: audioPlayer.url }}
     shouldPlay={audioPlayer.isPlaying}
     useNativeControls={false}
     volume={1.0}
     isMuted={false}
     style={{ width: 0, height: 0 }}

     onPlaybackStatusUpdate={(status) => {
      if (!status.isLoaded) return;

      setAudioPlayer(prev => ({
       ...prev,
       progress: status.positionMillis,
       duration: status.durationMillis || 1,
       isPlaying: status.isPlaying
      }));
     }}
    />
   )}
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
 header: {
  flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1,
  shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, zIndex: 10
 },
 backBtn: { padding: 4 },
 avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginLeft: 4 },
 avatarTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
 headerInfo: { flex: 1, marginLeft: 10 },
 headerName: { fontSize: 17, fontWeight: "700" },
 headerStatus: { fontSize: 12, marginTop: 1 },
 headerActions: { flexDirection: "row", gap: 4 },
 headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
 loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
 msgList: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, justifyContent: "flex-end" },
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
 emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6, transform: [{ scaleY: -1 }] },
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

 // ─── Media Styles ───
 mediaContainer: { width: 220, height: 220, borderRadius: 10, overflow: "hidden", marginBottom: 4 },
 bubbleImage: { width: "100%", height: "100%", resizeMode: "cover" },
 playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" },
 uploadOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
 progressBarWrap: { width: "70%", height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, marginTop: 10, overflow: "hidden" },
 progressBar: { height: "100%", backgroundColor: "#fff" },

 // Voice Bubble
 voiceBubble: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, gap: 10, width: 200 },
 voiceWaveform: { flex: 1, height: 30, justifyContent: "center" },
 voiceBar: { height: 4, borderRadius: 2, overflow: "hidden" },
 voiceProgress: { height: "100%", borderRadius: 2 },
 voiceDuration: { fontSize: 11 },

 // Attachment Menu
 attachBtn: { padding: 8, marginRight: 4 },
 attachMenu: {
  position: "absolute", bottom: 80, left: 16, right: 16,
  padding: 20, borderRadius: 24, flexDirection: "row", gap: 20,
  shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
 },
 attachItem: { alignItems: "center", gap: 6 },
 attachIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
 attachTxt: { fontSize: 12, fontWeight: "600" },

 // Recording UI
 recordingContainer: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12 },
 recordTime: { fontSize: 16, fontWeight: "600" },
 slideCancel: { flexDirection: "row", alignItems: "center", gap: 4 },
 slideCancelTxt: { fontSize: 14 },

 // Media Viewer
 viewerOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
 viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
 fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
 viewerCaption: { position: "absolute", bottom: 50, left: 20, right: 20, padding: 15, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12 },
 viewerCaptionTxt: { color: "#fff", fontSize: 15, textAlign: "center" },

 // Profile Popup
 popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
 popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
 popupCard: {
  width: 260, borderRadius: 20, alignItems: "center",
  paddingBottom: 24, overflow: "hidden",
  shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
 },
 popupImage: { width: 260, height: 260, resizeMode: "cover" },
 popupAvatarPlaceholder: { width: 260, height: 260, justifyContent: "center", alignItems: "center" },
 popupAvatarTxt: { color: "#fff", fontSize: 72, fontWeight: "700" },
 popupName: { fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" },
});
