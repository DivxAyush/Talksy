import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatHeader = React.memo(({ 
  navigation, 
  displayName, 
  displayPic, 
  isOnline, 
  isReceiverTyping, 
  onProfilePress,
  isDark,
  textMain,
  textSub,
  headerBg,
  border,
  user
}) => {
  return (
    <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={24} color={textMain} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.8}>
        <View style={[s.avatar, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
          {displayPic ? (
            <Image source={{ uri: displayPic }} style={s.avatarImg} />
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
        <TouchableOpacity 
          style={[s.headerIconBtn, { backgroundColor: isDark ? "#2a3942" : "#f5f5f5" }]}
          onPress={() => navigation.navigate('VideoCallScreen', { user, isCaller: true })}
        >
          <Ionicons name="videocam-outline" size={22} color={textMain} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.headerIconBtn, { backgroundColor: isDark ? "#2a3942" : "#f5f5f5" }]}
          onPress={() => navigation.navigate('CallScreen', { user, isCaller: true })}
        >
          <Ionicons name="call-outline" size={20} color={textMain} />
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prev, next) => {
  return (
    prev.displayName === next.displayName &&
    prev.displayPic === next.displayPic &&
    prev.isOnline === next.isOnline &&
    prev.isReceiverTyping === next.isReceiverTyping &&
    prev.isDark === next.isDark &&
    prev.textMain === next.textMain &&
    prev.textSub === next.textSub &&
    prev.headerBg === next.headerBg &&
    prev.border === next.border
  );
});

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, zIndex: 10
  },
  backBtn: { padding: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginLeft: 4 },
  avatarImg: { width: "100%", height: "100%", borderRadius: 20 },
  avatarTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 17, fontWeight: "700" },
  headerStatus: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
});

export default ChatHeader;
