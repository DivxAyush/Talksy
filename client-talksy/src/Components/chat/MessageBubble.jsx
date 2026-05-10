import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatTime } from "../../utils/chat/formatters";
import StatusTicks from "./StatusTicks";
import VoicePlayer from "./VoicePlayer";

const MessageBubble = React.memo(({ item, senderId, displayName, myBubble, otherBubble, myBubbleTxt, otherBubbleTxt, accentPurple, textSub, onLongPress, onPressMedia }) => {
  const isMe = item.senderId === senderId;
  const deleted = item.isDeleted;
  const isMedia = item.messageType && item.messageType !== "text";

  return (
    <TouchableOpacity
      style={[s.bubbleWrap, isMe ? s.bubbleRight : s.bubbleLeft]}
      onLongPress={() => !deleted && onLongPress(item)}
      onPress={() => {
        if (isMedia && !deleted) {
          onPressMedia(item);
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
  );
});

const s = StyleSheet.create({
  bubbleWrap: { marginBottom: 6, maxWidth: "78%" },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubble: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, borderRadius: 18 },
  bubbleTxt: { fontSize: 15, lineHeight: 20 },
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
