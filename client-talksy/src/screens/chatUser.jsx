import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import {
  View, Text, FlatList, ActivityIndicator, Keyboard, Animated, 
  Vibration, Alert, KeyboardAvoidingView, PanResponder
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

// Contexts
import { SocketContext } from "../context/SocketContext";
import { ChatContext } from "../context/ChatContext";

// Hooks
import { useChatMessages } from "../hooks/chat/useChatMessages";
import { useRealtimeSocket } from "../hooks/chat/useRealtimeSocket";
import { useChatAppState } from "../hooks/chat/useChatAppState";
import { useMediaUpload } from "../hooks/chat/useMediaUpload";
import { useVoiceRecording } from "../hooks/chat/useVoiceRecording";
import { useChatActions } from "../hooks/chat/useChatActions";
import { useThemeColors } from "../hooks/chat/useThemeColors";

// Components
import ChatHeader from "../Components/chat/ChatHeader";
import ChatInputBar from "../Components/chat/ChatInputBar";
import MessageBubble from "../Components/chat/MessageBubble";
import ActionSheet from "../Components/chat/ActionSheet";
import MediaViewer from "../Components/chat/MediaViewer";
import ProfilePopup from "../Components/chat/ProfilePopup";
import ReplyPreview from "../Components/chat/ReplyPreview";
import TypingBubble from "../Components/chat/TypingBubble";
import UploadingBubble from "../Components/chat/UploadingBubble";

// Utils & Styles
import { s } from "./ChatUser.styles";

export default function ChatUser({ route, navigation }) {
  const { user } = route.params;
  const receiverId = user._id || user.id;

  // Profile data
  const [displayName, setDisplayName] = useState(user.name || user.username || "User");
  const [displayPic, setDisplayPic] = useState(user.profilePic || "");
  const [senderId, setSenderId] = useState("");
  const senderIdRef = useRef("");

  // UI State
  const [text, setText] = useState("");
  const textRef = useRef("");
  const [replyMsg, setReplyMsg] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);

  // Animations
  const popupAnim = useRef(new Animated.Value(0)).current;
  const attachAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;
  const recordSlideAnim = useRef(new Animated.Value(0)).current;
  const typingDots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  // Colors & Contexts
  const colors = useThemeColors();
  const { isDark, headerBg, surface, textMain, textSub, border, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, accentPurple, bg } = colors;
  
  const { socket, onlineUsers, typingUsers, registerProfileUpdateHandler, unregisterProfileUpdateHandler } = useContext(SocketContext);
  const { setCurrentChat, clearUnreadCount } = useContext(ChatContext);

  const isOnline = onlineUsers.includes(receiverId);
  const isReceiverTyping = typingUsers[receiverId] || false;

  // Custom Hooks
  const { messages, setMessages, loading, loadingMore, page, hasMore, fetchMessages, processedReadIdsRef } = useChatMessages(senderId, receiverId);
  const { flushIncomingBuffer } = useRealtimeSocket(receiverId, setMessages, processedReadIdsRef);
  const { uploadingMedia, handleMediaUpload, pickImage, pickVideo } = useMediaUpload(senderId, receiverId, setMessages, replyMsg, setReplyMsg);
  const { isRecording, isRecordingRef, recordDuration, startRecording, stopRecording } = useVoiceRecording(handleMediaUpload);
  const { sendMessage, retryMessage, sending } = useChatActions(senderId, receiverId, setMessages, replyMsg, setReplyMsg, text, setText, textRef);
  useChatAppState(senderId, receiverId, fetchMessages, setMessages);

  const flatRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // ─── Typing Animation ───
  useEffect(() => {
    if (!isReceiverTyping) return;
    const anims = typingDots.map((dot, i) => 
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => { anims.forEach(a => a.stop()); typingDots.forEach(d => d.setValue(0)); };
  }, [isReceiverTyping]);

  // ─── Initial Logic ───
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
    return () => {
      setCurrentChat(null);
      if (isTypingRef.current && socket) {
        socket.emit("typing_stop", { senderId: senderIdRef.current, receiverId });
      }
      clearTimeout(typingTimerRef.current);
    };
  }, [receiverId]);

  useEffect(() => { if (senderId && receiverId) fetchMessages(); }, [senderId, receiverId, fetchMessages]);

  useEffect(() => {
    registerProfileUpdateHandler((data) => {
      if (data.userId === receiverId) {
        if (data.name) setDisplayName(data.name);
        if (data.profilePic !== undefined) setDisplayPic(data.profilePic);
      }
    });
    return () => unregisterProfileUpdateHandler();
  }, [receiverId, registerProfileUpdateHandler, unregisterProfileUpdateHandler]);

  // ─── UI Handlers ───
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

  const toggleAttachMenu = () => {
    setShowAttachMenu(!showAttachMenu);
    Animated.spring(attachAnim, { toValue: showAttachMenu ? 0 : 1, useNativeDriver: true }).start();
  };

  const openActionModal = useCallback((msg) => {
    Vibration.vibrate(50);
    setSelectedMsg(msg);
    Animated.timing(actionAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  const closeActionModal = () => {
    Animated.timing(actionAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSelectedMsg(null));
  };

  const handleCopy = async () => {
    if (selectedMsg?.message) await Clipboard.setStringAsync(selectedMsg.message);
    closeActionModal();
  };

  const handleReply = () => { setReplyMsg(selectedMsg); closeActionModal(); };

  const handleDelete = () => {
    closeActionModal();
    const isMe = selectedMsg?.senderId === senderId;
    setTimeout(() => {
      const options = [
        { text: "Cancel", style: "cancel" },
        { text: "Delete for me", onPress: () => {
          if (socket) socket.emit("delete_message", { messageId: selectedMsg._id, userId: senderId, deleteForEveryone: false });
          setMessages(prev => prev.filter(m => m._id !== selectedMsg._id));
        }},
      ];
      if (isMe) {
        options.push({ text: "Delete for everyone", style: "destructive", onPress: () => {
          if (socket) socket.emit("delete_message", { messageId: selectedMsg._id, userId: senderId, deleteForEveryone: true });
          setMessages(prev => prev.map(m => m._id === selectedMsg._id ? { ...m, isDeleted: true, message: "This message was deleted" } : m));
        }});
      }
      Alert.alert("Delete Message", "Choose an option", options);
    }, 300);
  };

  const markVisibleAsRead = useCallback((viewableItems) => {
    if (!socket || !senderId) return;
    const unreadIds = viewableItems
      .filter(({ item }) => item.senderId === receiverId && item.status !== "read" && !processedReadIdsRef.current.has(item._id))
      .map(({ item }) => item._id);

    if (unreadIds.length > 0) {
      unreadIds.forEach(id => processedReadIdsRef.current.add(id));
      socket.emit("message_read", { messageIds: unreadIds, senderId: receiverId });
      setMessages(prev => prev.map(m => unreadIds.includes(m._id) ? { ...m, status: "read" } : m));
    }
  }, [socket, senderId, receiverId, setMessages, processedReadIdsRef]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => { if (!textRef.current.trim()) startRecording(); },
    onPanResponderMove: (_, gesture) => {
      if (isRecordingRef.current && gesture.dx < 0) {
        recordSlideAnim.setValue(gesture.dx);
        if (gesture.dx < -120) { stopRecording(false); Vibration.vibrate(30); recordSlideAnim.setValue(0); }
      }
    },
    onPanResponderRelease: () => {
      if (textRef.current.trim()) { sendMessage(); } 
      else if (isRecordingRef.current) { stopRecording(true); }
      Animated.spring(recordSlideAnim, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => { if (isRecordingRef.current) stopRecording(false); recordSlideAnim.setValue(0); }
  })).current;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ChatHeader 
          navigation={navigation} displayName={displayName} displayPic={displayPic} 
          isOnline={isOnline} isReceiverTyping={isReceiverTyping} 
          onProfilePress={() => { setPopupVisible(true); Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }}
          isDark={isDark} textMain={textMain} textSub={textSub} headerBg={headerBg} border={border} user={user}
        />

        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={s.loaderWrap}><ActivityIndicator size="large" color={textMain} /></View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(item) => item._id || item.clientId}
              renderItem={({ item }) => (
                <MessageBubble 
                  item={item} senderId={senderId} displayName={displayName} 
                  myBubble={myBubble} otherBubble={otherBubble} myBubbleTxt={myBubbleTxt} otherBubbleTxt={otherBubbleTxt}
                  accentPurple={accentPurple} textSub={textSub} onLongPress={openActionModal}
                  onPressMedia={(m) => setMediaViewer({ type: m.messageType, url: m.mediaUrl, caption: m.message })}
                />
              )}
              contentContainerStyle={s.msgList}
              inverted keyboardShouldPersistTaps="handled"
              onEndReached={() => { if (hasMore && !loadingMore) fetchMessages(page + 1, true); }}
              onEndReachedThreshold={0.5}
              onViewableItemsChanged={({ viewableItems }) => markVisibleAsRead(viewableItems)}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50, minimumViewTime: 300 }}
              ListHeaderComponent={
                <View>
                  {isReceiverTyping && <TypingBubble otherBubble={otherBubble} dot1={typingDots[0]} dot2={typingDots[1]} dot3={typingDots[2]} textSub={textSub} />}
                  {Object.entries(uploadingMedia).map(([id, data]) => <UploadingBubble key={id} data={data} myBubble={myBubble} />)}
                </View>
              }
              ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={textSub} style={{ marginVertical: 10 }} /> : null}
            />
          )}
        </View>

        <ReplyPreview replyMsg={replyMsg} senderId={senderId} displayName={displayName} setReplyMsg={setReplyMsg} headerBg={headerBg} border={border} textSub={textSub} />
        
        <ChatInputBar 
          text={text} handleTextChange={handleTextChange} isRecording={isRecording} 
          recordDuration={recordDuration} recordSlideAnim={recordSlideAnim} panHandlers={panResponder.panHandlers}
          sending={sending} hasText={text.trim().length > 0} toggleAttachMenu={toggleAttachMenu}
          textMain={textMain} textSub={textSub} surface={surface} headerBg={headerBg} border={border} myBubble={myBubble}
        />

        <ActionSheet 
          selectedMsg={selectedMsg} actionAnim={actionAnim} closeActionModal={closeActionModal}
          handleCopy={handleCopy} handleReply={handleReply} handleDelete={handleDelete} retryMessage={retryMessage}
          headerBg={headerBg} surface={surface} textMain={textMain} border={border}
        />

        <MediaViewer mediaViewer={mediaViewer} setMediaViewer={setMediaViewer} />
        
        <ProfilePopup 
          popupVisible={popupVisible} popupAnim={popupAnim} setPopupVisible={setPopupVisible} 
          displayPic={displayPic} displayName={displayName} isDark={isDark} textMain={textMain}
        />

        {showAttachMenu && (
          <Animated.View style={[s.attachMenu, { backgroundColor: headerBg, opacity: attachAnim, transform: [{ translateY: attachAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
            <TouchableOpacity style={s.attachItem} onPress={() => pickImage(toggleAttachMenu)}>
              <View style={[s.attachIcon, { backgroundColor: "#a855f7" }]}><Ionicons name="image" size={24} color="#fff" /></View>
              <Text style={[s.attachTxt, { color: textMain }]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={() => pickVideo(toggleAttachMenu)}>
              <View style={[s.attachIcon, { backgroundColor: "#ef4444" }]}><Ionicons name="videocam" size={24} color="#fff" /></View>
              <Text style={[s.attachTxt, { color: textMain }]}>Video</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
