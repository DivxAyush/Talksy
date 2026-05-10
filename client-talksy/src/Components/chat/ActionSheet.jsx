import React from "react";
import { View, Text, TouchableOpacity, Animated, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ActionSheet = ({ 
  selectedMsg, 
  actionAnim, 
  closeActionModal, 
  handleCopy, 
  handleReply, 
  handleDelete, 
  retryMessage,
  headerBg,
  surface,
  textMain,
  border
}) => {
  return (
    <Modal visible={!!selectedMsg} transparent animationType="none" onRequestClose={closeActionModal}>
      <View style={s.modalOverlayWrap}>
        <Animated.View style={[s.modalBackdrop, { opacity: actionAnim }]} />
        <Pressable style={s.modalDismiss} onPress={closeActionModal} />
        <Animated.View style={[s.actionSheet, {
          backgroundColor: headerBg,
          transform: [{ translateY: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }]
        }]}>
          <View style={s.sheetHandle} />
          <View style={[s.sheetMsgBubble, { backgroundColor: surface }]}>
            <Text style={[s.sheetMsgText, { color: textMain }]}>{selectedMsg?.message}</Text>
          </View>
          {[
            ...(selectedMsg?.status === "failed" ? [{ label: "Retry", icon: "refresh-outline", action: () => { retryMessage(selectedMsg); closeActionModal(); } }] : []),
            { label: "Copy", icon: "copy-outline", action: handleCopy },
            { label: "Reply", icon: "arrow-undo-outline", action: handleReply },
            { label: "Delete", icon: "trash-outline", action: handleDelete },
          ].map((opt, i) => (
            <TouchableOpacity key={i} style={[s.actionRow, { borderBottomColor: border }]} onPress={opt.action}>
              <Text style={[s.actionRowTxt, { color: opt.label === "Delete" ? "#e74c3c" : textMain }]}>{opt.label}</Text>
              <Ionicons name={opt.icon} size={20} color={opt.label === "Delete" ? "#e74c3c" : textMain} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  modalOverlayWrap: { flex: 1, justifyContent: "flex-end", paddingBottom: 24 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  modalDismiss: { flex: 1 },
  actionSheet: { borderRadius: 24, marginHorizontal: 16, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16 },
  sheetMsgBubble: { borderRadius: 16, padding: 12, marginBottom: 20, alignSelf: "flex-start", maxWidth: "100%" },
  sheetMsgText: { fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  actionRowTxt: { fontSize: 15, fontWeight: "500" },
});

export default ActionSheet;
