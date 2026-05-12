import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../../theme/designTokens";

const ReplyPreview = ({ replyMsg, senderId, displayName, setReplyMsg, headerBg, border, textSub }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevReplyRef = useRef(null);

  useEffect(() => {
    if (replyMsg && !prevReplyRef.current) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 22,
      }).start();
    } else if (!replyMsg) {
      slideAnim.setValue(0);
    }
    prevReplyRef.current = replyMsg;
  }, [replyMsg]);

  if (!replyMsg) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <Animated.View style={[s.replyBar, { 
      backgroundColor: headerBg, 
      borderTopColor: border,
      transform: [{ translateY }],
      opacity: slideAnim,
    }]}>
      <View style={s.replyBarContent}>
        <View style={[s.replyBarLine, { backgroundColor: "#C4734A" }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.replyBarName, { color: "#C4734A" }]}>
            {replyMsg.senderId === senderId ? "You" : displayName}
          </Text>
          <Text style={[s.replyBarTxt, { color: textSub }]} numberOfLines={1}>
            {replyMsg.message || (replyMsg.messageType === "image" ? "📷 Photo" : replyMsg.messageType === "video" ? "🎥 Video" : "🎤 Voice message")}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => setReplyMsg(null)} style={s.closeBtn} activeOpacity={0.6}>
        <Ionicons name="close" size={18} color={textSub} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 0.5,
  },
  replyBarContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  replyBarLine: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginRight: spacing.sm + 2,
  },
  replyBarName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 1,
  },
  replyBarTxt: { fontSize: 13 },
  closeBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
});

export default ReplyPreview;
