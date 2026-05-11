import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatTime } from "../../utils/chat/formatters";
import StatusTicks from "./StatusTicks";
import VoicePlayer from "./VoicePlayer";

const formatDateHeader = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const oneDay = 86400000;
  if (diff < oneDay && date.getDate() === now.getDate()) return "Today";
  if (diff < 2 * oneDay && date.getDate() === new Date(now - oneDay).getDate()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const MessageBubble = React.memo(({ 
  item, senderId, displayName, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, 
  accentPurple, textSub, onLongPress, onPressMedia, 
  isGroupedStart, isGroupedEnd, showDate, onSwipeToReply 
}) => {
  const isMe = item.senderId === senderId;
  const deleted = item.isDeleted;
  const isMedia = item.messageType && item.messageType !== "text";

  // Swipe to reply logic
  const panX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow horizontal swipe to right
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 0 && !deleted;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          panX.setValue(Math.min(gestureState.dx, 60)); // Max swipe distance 60
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 40) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwipeToReply(item);
        }
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
      }
    })
  ).current;

  return (
    <View style={s.container}>
      {showDate && (
        <View style={s.dateHeaderWrap}>
          <Text style={[s.dateHeaderTxt, { backgroundColor: myBubble, color: myBubbleTxt }]}>
            {formatDateHeader(item.createdAt)}
          </Text>
        </View>
      )}
      
      <Animated.View style={{ transform: [{ translateX: panX }] }} {...panResponder.panHandlers}>
        <View style={s.replyIconWrap}>
          <Ionicons name="arrow-undo" size={20} color={textSub} style={{ opacity: 0.5 }} />
        </View>
        <TouchableOpacity
          style={[
            s.bubbleWrap, 
            isMe ? s.bubbleRight : s.bubbleLeft,
            isGroupedEnd ? { marginBottom: 2 } : { marginBottom: 12 }
          ]}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!deleted) onLongPress(item);
          }}
          onPress={() => {
            if (isMedia && !deleted) onPressMedia(item);
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
        isMe ? { backgroundColor: myBubble } : { backgroundColor: otherBubble },
        isMe ? { borderBottomRightRadius: isGroupedEnd ? 18 : 4, borderTopRightRadius: isGroupedStart ? 18 : 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 } : 
               { borderBottomLeftRadius: isGroupedEnd ? 18 : 4, borderTopLeftRadius: isGroupedStart ? 18 : 4, borderTopRightRadius: 18, borderBottomRightRadius: 18 },
        isMedia && { padding: 4, borderRadius: 16 }
      ]}>
        {deleted ? (
          <Text style={[s.deletedTxt, { color: isMe ? "rgba(255,255,255,0.5)" : textSub }, { paddingHorizontal: 10, paddingVertical: 4 }]}>
            🚫 This message was deleted
          </Text>
        ) : (
          <>
            {item.messageType === "image" && (
              <View style={s.mediaContainer}>
                <Image source={{ uri: item.mediaUrl }} style={s.bubbleImage} cachePolicy="disk" />
              </View>
            )}
            {item.messageType === "video" && (
              <View style={s.mediaContainer}>
                <Image source={{ uri: item.mediaThumbnail || item.mediaUrl }} style={s.bubbleImage} cachePolicy="disk" />
                <View style={s.playOverlay}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
              </View>
            )}
            {item.messageType === "voice" && (
              <VoicePlayer item={item} isMe={isMe} accentPurple={accentPurple} textSub={textSub} />
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
    </Animated.View>
  </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparator: skip rerender if message data hasn't changed
  // Callbacks (onLongPress, onPressMedia) are intentionally excluded —
  // they use the item from closure, so stale refs are safe here
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.clientId === nextProps.item.clientId &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.isDeleted === nextProps.item.isDeleted &&
    prevProps.item.message === nextProps.item.message &&
    prevProps.item.mediaUrl === nextProps.item.mediaUrl &&
    prevProps.senderId === nextProps.senderId &&
    prevProps.isGroupedStart === nextProps.isGroupedStart &&
    prevProps.isGroupedEnd === nextProps.isGroupedEnd &&
    prevProps.showDate === nextProps.showDate
  );
});

const s = StyleSheet.create({
  container: { width: "100%" },
  dateHeaderWrap: { alignItems: "center", marginVertical: 16 },
  dateHeaderTxt: { fontSize: 12, fontWeight: "600", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: "hidden" },
  replyIconWrap: { position: "absolute", left: -40, top: "50%", marginTop: -10, width: 30, height: 30, justifyContent: "center", alignItems: "center" },
  bubbleWrap: { maxWidth: "80%" },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubble: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  bubbleTxt: { fontSize: 15.5, lineHeight: 22 },
  deletedTxt: { fontSize: 14, fontStyle: "italic" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 2 },
  timeTxt: { fontSize: 11 },
  replyRef: { borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4 },
  replyRefName: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  replyRefTxt: { fontSize: 13 },
  mediaContainer: { width: 220, height: 220, borderRadius: 10, overflow: "hidden", marginBottom: 4 },
  bubbleImage: { width: "100%", height: "100%", resizeMode: "cover" },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" },
});

export default MessageBubble;
