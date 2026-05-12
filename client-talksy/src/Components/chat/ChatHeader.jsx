import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius, typography, shadows } from "../../theme/designTokens";

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
  const copper = "#C4734A";
  
  return (
    <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.6}>
        <Ionicons name="arrow-back" size={22} color={textMain} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7} style={s.avatarTouch}>
        <View style={[s.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}>
          {displayPic ? (
            <Image source={{ uri: displayPic }} style={s.avatarImg} />
          ) : (
            <Text style={[s.avatarTxt, { color: isDark ? "#FFFFFF" : "#C4734A" }]}>{displayName?.charAt(0)?.toUpperCase()}</Text>
          )}
        </View>
        {isOnline && (
          <View style={[s.onlineDot, { borderColor: headerBg, backgroundColor: copper }]} />
        )}
      </TouchableOpacity>
      
      <View style={s.headerInfo}>
        <Text style={[s.headerName, { color: textMain }]} numberOfLines={1}>{displayName}</Text>
        <Text style={[
          s.headerStatus, 
          { color: isReceiverTyping ? copper : isOnline ? copper : textSub },
          isReceiverTyping && s.typingText,
        ]}>
          {isReceiverTyping ? "typing..." : isOnline ? "Online" : "offline"}
        </Text>
      </View>
      
      <View style={s.headerActions}>
        <TouchableOpacity 
          style={[s.headerIconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(196,115,74,0.08)" }]}
          onPress={() => navigation.navigate('VideoCallScreen', { user, isCaller: true })}
          activeOpacity={0.6}
        >
          <Ionicons name="videocam-outline" size={20} color={textMain} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.headerIconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(196,115,74,0.08)" }]}
          onPress={() => navigation.navigate('CallScreen', { user, isCaller: true })}
          activeOpacity={0.6}
        >
          <Ionicons name="call-outline" size={19} color={textMain} />
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
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    ...shadows.md,
    zIndex: 10,
  },
  backBtn: { 
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  avatarTouch: {
    position: "relative",
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: radius.avatar.md, 
    justifyContent: "center", 
    alignItems: "center",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: radius.avatar.md },
  avatarTxt: { fontSize: 16, fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerInfo: { flex: 1, marginLeft: spacing.sm + 2 },
  headerName: {
    fontSize: typography.headerName.fontSize,
    fontWeight: typography.headerName.fontWeight,
    letterSpacing: typography.headerName.letterSpacing,
  },
  headerStatus: { 
    fontSize: 12.5, 
    marginTop: 1,
    fontWeight: "400",
  },
  typingText: {
    fontWeight: "500",
    fontStyle: "italic",
  },
  headerActions: { flexDirection: "row", gap: spacing.sm - 2 },
  headerIconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: radius.bubble, 
    justifyContent: "center", 
    alignItems: "center",
  },
});

export default ChatHeader;
