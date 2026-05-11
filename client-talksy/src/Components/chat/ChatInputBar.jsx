import React from "react";
import { View, TextInput, TouchableOpacity, Text, Animated, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatDuration } from "../../utils/chat/formatters";

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
          <Ionicons name="mic" size={24} color="#e74c3c" />
          <Text style={[s.recordTime, { color: textMain }]}>{formatDuration(recordDuration)}</Text>
          <Animated.View style={[s.slideCancel, { transform: [{ translateX: recordSlideAnim }] }]}>
            <Ionicons name="chevron-back" size={20} color={textSub} />
            <Text style={[s.slideCancelTxt, { color: textSub }]}>Slide to cancel</Text>
          </Animated.View>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleAttachMenu();
          }} style={s.attachBtn}>
            <Ionicons name="add" size={28} color={textSub} />
          </TouchableOpacity>
          <View style={[s.inputBox, { backgroundColor: surface }]}>
            <TextInput
              style={[s.input, { color: textMain }]}
              placeholder="Type a message..."
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
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1 },
  inputBox: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, minHeight: 40, maxHeight: 100, justifyContent: "center" },
  input: { fontSize: 15, padding: 0 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center" },
  attachBtn: { padding: 8, marginRight: 4 },
  recordingContainer: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12 },
  recordTime: { fontSize: 16, fontWeight: "600" },
  slideCancel: { flexDirection: "row", alignItems: "center", gap: 4 },
  slideCancelTxt: { fontSize: 14 },
});

export default ChatInputBar;
