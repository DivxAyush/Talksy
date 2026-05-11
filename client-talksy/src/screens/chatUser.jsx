import React, { useEffect, useState, useRef, useCallback, useContext, useMemo } from "react";
import {
  View, Text, FlatList, ActivityIndicator, Keyboard, Animated, 
  Alert, KeyboardAvoidingView, PanResponder, TouchableOpacity, Platform
} from "react-native";
import * as Haptics from "expo-haptics";
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

// ─── Module-level stable keyExtractor (never recreated) ───
const msgKeyExtractor = (item) => item._id || item.clientId;

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

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);
  const startRecordingRef = useRef(startRecording);
  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);
  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => { stopRecordingRef.current = stopRecording; }, [stopRecording]);

  useEffect(() => {
    registerProfileUpdateHandler((data) => {
      if (data.userId === receiverId) {
        if (data.name) setDisplayName(data.name);
        if (data.profilePic !== undefined) setDisplayPic(data.profilePic);
      }
    });
    return () => unregisterProfileUpdateHandler();
  }, [receiverId, registerProfileUpdateHandler, unregisterProfileUpdateHandler]);

  // ─── UI Handlers (stabilized with useCallback) ───
  const handleTextChange = useCallback((val) => {
    setText(val);
    textRef.current = val;
    if (!socket) return;
    if (!isTypingRef.current && val.trim()) {
      isTypingRef.current = true;
      socket.emit("typing_start", { senderId: senderIdRef.current, receiverId });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("typing_stop", { senderId: senderIdRef.current, receiverId });
      }
    }, 2000);
  }, [socket, receiverId]);

  const toggleAttachMenu = useCallback(() => {
    setShowAttachMenu(prev => {
      Animated.spring(attachAnim, { toValue: prev ? 0 : 1, useNativeDriver: true }).start();
      return !prev;
    });
  }, [attachAnim]);

  const openActionModal = useCallback((msg) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMsg(msg);
    Animated.timing(actionAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [actionAnim]);

  const closeActionModal = useCallback(() => {
    Animated.timing(actionAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSelectedMsg(null));
  }, []);

  const handleCopy = useCallback(async () => {
    if (selectedMsg?.message) await Clipboard.setStringAsync(selectedMsg.message);
    closeActionModal();
  }, [selectedMsg, closeActionModal]);

  const handleReply = useCallback(() => { setReplyMsg(selectedMsg); closeActionModal(); }, [selectedMsg, closeActionModal]);

  const handleDelete = useCallback(() => {
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
  }, [selectedMsg, senderId, socket, setMessages, closeActionModal]);

  // ─── FlatList Performance: Stable read-receipt handler via ref ───
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

  // Ref-based handlers for FlatList (must be stable across renders to avoid VirtualizedList warning)
  const markVisibleAsReadRef = useRef(markVisibleAsRead);
  useEffect(() => { markVisibleAsReadRef.current = markVisibleAsRead; }, [markVisibleAsRead]);

  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    markVisibleAsReadRef.current(viewableItems);
  });

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  });

  // ─── Stable media press handler ───
  const handlePressMedia = useCallback((m) => {
    setMediaViewer({ type: m.messageType, url: m.mediaUrl, caption: m.message });
  }, []);

  // ─── Memoized renderItem (prevents MessageBubble prop identity churn) ───
  const renderMessage = useCallback(({ item, index }) => {
    // Note: Since FlatList is inverted, index 0 is the newest message.
    // index + 1 is the OLDER message, index - 1 is the NEWER message.
    const olderMsg = messages[index + 1];
    const newerMsg = messages[index - 1];

    const isSameSenderAsOlder = olderMsg && olderMsg.senderId === item.senderId;
    const isSameSenderAsNewer = newerMsg && newerMsg.senderId === item.senderId;

    // Time difference for grouping (e.g., 5 mins)
    const timeDiffOlder = olderMsg ? Math.abs(new Date(item.createdAt) - new Date(olderMsg.createdAt)) : 0;
    const timeDiffNewer = newerMsg ? Math.abs(new Date(newerMsg.createdAt) - new Date(item.createdAt)) : 0;

    const isGroupedStart = isSameSenderAsOlder && timeDiffOlder < 300000;
    const isGroupedEnd = isSameSenderAsNewer && timeDiffNewer < 300000;

    // Show date if it's the first message of the day (chronologically oldest, so no older message or older message is on a different day)
    let showDate = false;
    if (!olderMsg) {
      showDate = true;
    } else {
      const currentDate = new Date(item.createdAt).toDateString();
      const olderDate = new Date(olderMsg.createdAt).toDateString();
      if (currentDate !== olderDate) showDate = true;
    }

    return (
      <MessageBubble 
        item={item} senderId={senderId} displayName={displayName} 
        myBubble={myBubble} otherBubble={otherBubble} myBubbleTxt={myBubbleTxt} otherBubbleTxt={otherBubbleTxt}
        accentPurple={accentPurple} textSub={textSub} onLongPress={openActionModal}
        onPressMedia={handlePressMedia}
        isGroupedStart={isGroupedStart}
        isGroupedEnd={isGroupedEnd}
        showDate={showDate}
        onSwipeToReply={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setReplyMsg(item);
        }}
      />
    );
  }, [messages, senderId, displayName, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, accentPurple, textSub, openActionModal, handlePressMedia]);

  // ─── Stable pagination handler ───
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) fetchMessages(page + 1, true);
  }, [hasMore, loadingMore, page, fetchMessages]);

  // ─── Memoized List Header (typing + uploading indicators) ───
  const listHeader = useMemo(() => (
    <View>
      {isReceiverTyping && <TypingBubble otherBubble={otherBubble} dot1={typingDots[0]} dot2={typingDots[1]} dot3={typingDots[2]} textSub={textSub} />}
      {Object.entries(uploadingMedia).map(([id, data]) => <UploadingBubble key={id} data={data} myBubble={myBubble} />)}
    </View>
  ), [isReceiverTyping, otherBubble, textSub, uploadingMedia, myBubble]);

  // ─── Memoized List Footer ───
  const listFooter = useMemo(() => (
    loadingMore ? <ActivityIndicator size="small" color={textSub} style={{ marginVertical: 10 }} /> : null
  ), [loadingMore, textSub]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => { if (!textRef.current.trim()) startRecordingRef.current(); },
    onPanResponderMove: (_, gesture) => {
      if (isRecordingRef.current && gesture.dx < 0) {
        recordSlideAnim.setValue(gesture.dx);
        if (gesture.dx < -120) { stopRecordingRef.current(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); recordSlideAnim.setValue(0); }
      }
    },
    onPanResponderRelease: () => {
      if (textRef.current.trim()) { 
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sendMessageRef.current(); 
      } 
      else if (isRecordingRef.current) { stopRecordingRef.current(true); }
      Animated.spring(recordSlideAnim, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => { if (isRecordingRef.current) stopRecordingRef.current(false); recordSlideAnim.setValue(0); }
  })).current;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ChatHeader 
          navigation={navigation} displayName={displayName} displayPic={displayPic} 
          isOnline={isOnline} isReceiverTyping={isReceiverTyping} 
          onProfilePress={() => { setPopupVisible(true); Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }}
          isDark={isDark} textMain={textMain} textSub={textSub} headerBg={headerBg} border={border} 
          user={{ ...user, _id: receiverId, name: displayName, profilePic: displayPic }}
        />

        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={s.loaderWrap}><ActivityIndicator size="large" color={textMain} /></View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={msgKeyExtractor}
              renderItem={renderMessage}
              contentContainerStyle={s.msgList}
              inverted keyboardShouldPersistTaps="handled"
              // ─── Virtualization Tuning ───
              windowSize={11}
              initialNumToRender={15}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === "android"}
              // ─── Pagination ───
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              // ─── Read Receipts (stable refs prevent VirtualizedList warnings) ───
              onViewableItemsChanged={onViewableItemsChangedRef.current}
              viewabilityConfig={viewabilityConfigRef.current}
              // ─── Memoized Header/Footer ───
              ListHeaderComponent={listHeader}
              ListFooterComponent={listFooter}
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
