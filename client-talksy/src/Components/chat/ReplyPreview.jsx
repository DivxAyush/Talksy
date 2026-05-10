import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ReplyPreview = ({ replyMsg, senderId, displayName, setReplyMsg, headerBg, border, textSub }) => {
  if (!replyMsg) return null;

  return (
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
  );
};

const s = StyleSheet.create({
  replyBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  replyBarContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  replyBarLine: { width: 3, height: "100%", borderRadius: 2, marginRight: 10 },
  replyBarName: { fontSize: 13, fontWeight: "700" },
  replyBarTxt: { fontSize: 13 },
});

export default ReplyPreview;
