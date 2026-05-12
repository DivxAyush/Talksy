import React from "react";
import { View, TextInput, TouchableOpacity, Text, Animated, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatDuration } from "../../utils/chat/formatters";
import { spacing, radius, typography } from "../../theme/designTokens";

const ChatInputBar = React.memo(({
  text,
  handleTextChange,
  isRecording,
  recordDuration,
  recordSlideAnim,
  panHandlers,
  sending,
  hasText,
  toggleAttachMenu,
  textMain,
  textSub,
  surface,
  headerBg,
  border,
  myBubble
}) => {
  return (
    <View style={[s.inputBar, { backgroundColor: headerBg, borderTopColor: border }]}>
      {isRecording ? (
        <View style={s.recordingContainer}>
          <View style={s.recordingDotWrap}>
            <View style={s.recordingDot} />
          </View>
          <Text style={[s.recordTime, { color: textMain }]}>{formatDuration(recordDuration)}</Text>
          <Animated.View style={[s.slideCancel, { transform: [{ translateX: recordSlideAnim }] }]}>
            <Ionicons name="chevron-back" size={18} color={textSub} />
            <Text style={[s.slideCancelTxt, { color: textSub }]}>Slide to cancel</Text>
          </Animated.View>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleAttachMenu();
          }} style={s.attachBtn} activeOpacity={0.6}>
            <Ionicons name="add" size={26} color={textSub} />
          </TouchableOpacity>
          <View style={[s.inputBox, { backgroundColor: surface }]}>
            <TextInput
              style={[s.input, { color: textMain }]}
              placeholder="Message"
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
        {...panHandlers}
        style={[
          s.actionBtn,
          (hasText || isRecording) && { backgroundColor: myBubble },
          !hasText && !isRecording && { backgroundColor: "transparent" },
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
  );
}, (prev, next) => {
  // Custom comparator: skip rerender if visible state hasn't changed
  return (
    prev.text === next.text &&
    prev.isRecording === next.isRecording &&
    prev.recordDuration === next.recordDuration &&
    prev.sending === next.sending &&
    prev.hasText === next.hasText &&
    prev.textMain === next.textMain &&
    prev.textSub === next.textSub &&
    prev.surface === next.surface &&
    prev.headerBg === next.headerBg &&
    prev.border === next.border &&
    prev.myBubble === next.myBubble
  );
});

const s = StyleSheet.create({
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
  },
  inputBox: {
    flex: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    marginRight: spacing.sm,
    minHeight: 42,
    maxHeight: 100,
    justifyContent: "center",
  },
  input: {
    fontSize: typography.body.fontSize,
    padding: 0,
    lineHeight: 20,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  attachBtn: {
    padding: spacing.sm,
    marginRight: spacing.xs,
    marginBottom: 2,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  recordingDotWrap: {
    width: 10,
    height: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
  },
  recordTime: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  slideCancel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  slideCancelTxt: { fontSize: 14 },
});

export default ChatInputBar;
