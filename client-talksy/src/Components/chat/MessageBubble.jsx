import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatTime } from "../../utils/chat/formatters";
import StatusTicks from "./StatusTicks";
import VoicePlayer from "./VoicePlayer";
import { spacing, radius, typography, bubble } from "../../theme/designTokens";

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
  isGroupedStart, isGroupedEnd, showDate, onSwipeToReply,
  dateHeaderBg, dateHeaderText, myBubbleTime, otherBubbleTime, replyAccent,
}) => {
  const isMe = item.senderId === senderId;
  const deleted = item.isDeleted;
  const isMedia = item.messageType && item.messageType !== "text";

  // Swipe to reply logic
  const panX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = panX.interpolate({
    inputRange: [0, 20, 50],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 0 && !deleted;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          panX.setValue(Math.min(gestureState.dx, 60));
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
          tension: 300,
          friction: 20,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, tension: 300, friction: 20 }).start();
      }
    })
  ).current;

  // Dynamic bubble radius for grouped messages
  const getBubbleRadius = () => {
    const full = radius.bubble; // 18
    const tail = radius.bubbleTail; // 4
    
    if (isMe) {
      return {
        borderTopLeftRadius: full,
        borderBottomLeftRadius: full,
        borderTopRightRadius: isGroupedStart ? full : tail,
        borderBottomRightRadius: isGroupedEnd ? full : tail,
      };
    }
    return {
      borderTopRightRadius: full,
      borderBottomRightRadius: full,
      borderTopLeftRadius: isGroupedStart ? full : tail,
      borderBottomLeftRadius: isGroupedEnd ? full : tail,
    };
  };

  const bubbleRadius = getBubbleRadius();

  return (
    <View style={s.container}>
      {showDate && (
        <View style={s.dateHeaderWrap}>
          <View style={[s.dateHeaderPill, { backgroundColor: dateHeaderBg || "rgba(0,0,0,0.06)" }]}>
            <Text style={[s.dateHeaderTxt, { color: dateHeaderText || textSub }]}>
              {formatDateHeader(item.createdAt)}
            </Text>
          </View>
        </View>
      )}
      
      <Animated.View style={{ transform: [{ translateX: panX }] }} {...panResponder.panHandlers}>
        {/* Reply swipe icon */}
        <Animated.View style={[s.replyIconWrap, { opacity: replyIconOpacity }]}>
          <View style={s.replyIconCircle}>
            <Ionicons name="arrow-undo" size={16} color={textSub} />
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[
            s.bubbleWrap, 
            isMe ? s.bubbleRight : s.bubbleLeft,
            { marginBottom: isGroupedEnd ? bubble.groupedGap : bubble.ungroupedGap }
          ]}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!deleted) onLongPress(item);
          }}
          onPress={() => {
            if (isMedia && !deleted) onPressMedia(item);
          }}
          activeOpacity={0.7}
          disabled={deleted && !isMedia}
        >
          {/* Reply reference */}
          {item.replyToMessage && !deleted && (
            <View style={[s.replyRef, { 
              backgroundColor: isMe ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", 
              borderLeftColor: replyAccent || (isMe ? "rgba(255,255,255,0.5)" : "#C4734A") 
            }]}>
              <Text style={[s.replyRefName, { color: replyAccent || (isMe ? "rgba(255,255,255,0.5)" : "#C4734A") }]}>
                {item.replyToMessage.senderId === senderId ? "You" : displayName}
              </Text>
              <Text style={[s.replyRefTxt, { color: isMe ? "rgba(255,255,255,0.65)" : textSub }]} numberOfLines={1}>
                {item.replyToMessage.isDeleted ? "This message was deleted" : item.replyToMessage.message}
              </Text>
            </View>
          )}

          <View style={[
            s.bubble,
            { backgroundColor: isMe ? myBubble : otherBubble },
            bubbleRadius,
            isMedia && { padding: spacing.xs, borderRadius: radius.card }
          ]}>
            {deleted ? (
              <Text style={[s.deletedTxt, { color: isMe ? "rgba(255,255,255,0.45)" : textSub }]}>
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
                      <View style={s.playIconCircle}>
                        <Ionicons name="play" size={24} color="#fff" />
                      </View>
                    </View>
                  </View>
                )}
                {item.messageType === "voice" && (
                  <VoicePlayer item={item} isMe={isMe} accentPurple={accentPurple} textSub={textSub} />
                )}

                {item.message ? (
                  <Text style={[
                    s.bubbleTxt, 
                    { color: isMe ? myBubbleTxt : otherBubbleTxt }, 
                    isMedia && s.mediaCaptionTxt
                  ]}>
                    {item.message}
                  </Text>
                ) : null}
              </>
            )}

            <View style={[s.metaRow, isMedia && s.metaRowMedia]}>
              <Text style={[s.timeTxt, { color: myBubbleTime && isMe ? myBubbleTime : otherBubbleTime || "#aaa" }]}>
                {formatTime(item.createdAt)}
              </Text>
              {isMe && !deleted && (
                <View style={s.tickWrap}>
                  <StatusTicks status={item.status} />
                </View>
              )}
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
  
  // ─── Date Header ───
  dateHeaderWrap: { alignItems: "center", marginVertical: spacing.lg, marginTop: spacing.xl },
  dateHeaderPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  dateHeaderTxt: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  
  // ─── Reply Swipe Icon ───
  replyIconWrap: {
    position: "absolute",
    left: -36,
    top: "50%",
    marginTop: -14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  replyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(128,128,128,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // ─── Bubble Layout ───
  bubbleWrap: { maxWidth: bubble.maxWidth },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubble: {
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
  },
  bubbleTxt: {
    fontSize: typography.messageTxt.fontSize,
    lineHeight: typography.messageTxt.lineHeight,
  },
  mediaCaptionTxt: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deletedTxt: {
    fontSize: 14,
    fontStyle: "italic",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  // ─── Meta Row (time + ticks) ───
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 1,
    gap: 3,
  },
  metaRowMedia: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  timeTxt: {
    fontSize: typography.timestamp.fontSize,
    fontWeight: typography.timestamp.fontWeight,
  },
  tickWrap: {
    marginLeft: 2,
  },
  
  // ─── Reply Reference ───
  replyRef: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 2,
    marginBottom: spacing.xs,
  },
  replyRefName: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 1,
  },
  replyRefTxt: { fontSize: 13 },
  
  // ─── Media ───
  mediaContainer: {
    width: bubble.mediaDimension,
    height: bubble.mediaDimension,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  bubbleImage: { width: "100%", height: "100%", resizeMode: "cover" },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3,
  },
});

export default MessageBubble;
