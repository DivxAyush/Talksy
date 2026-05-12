import React from "react";
import { View, Text, TouchableOpacity, Animated, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { spacing, radius, typography, shadows } from "../../theme/designTokens";

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
  const actions = [
    ...(selectedMsg?.status === "failed" ? [{ label: "Retry", icon: "refresh-outline", action: () => { retryMessage(selectedMsg); closeActionModal(); } }] : []),
    { label: "Copy", icon: "copy-outline", action: handleCopy },
    { label: "Reply", icon: "arrow-undo-outline", action: handleReply },
    { label: "Delete", icon: "trash-outline", action: handleDelete, isDanger: true },
  ];

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
          
          {selectedMsg?.message ? (
            <View style={[s.sheetMsgBubble, { backgroundColor: surface }]}>
              <Text style={[s.sheetMsgText, { color: textMain }]} numberOfLines={3}>
                {selectedMsg.message}
              </Text>
            </View>
          ) : null}

          <View style={s.actionsContainer}>
            {actions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.actionRow,
                  i < actions.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: border },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  opt.action();
                }}
                activeOpacity={0.6}
              >
                <View style={[s.actionIconWrap, { backgroundColor: opt.isDanger ? "rgba(231,76,60,0.08)" : "rgba(0,0,0,0.04)" }]}>
                  <Ionicons name={opt.icon} size={18} color={opt.isDanger ? "#e74c3c" : textMain} />
                </View>
                <Text style={[s.actionRowTxt, { color: opt.isDanger ? "#e74c3c" : textMain }]}>
                  {opt.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={opt.isDanger ? "#e74c3c" : border} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  modalOverlayWrap: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalDismiss: { flex: 1 },
  actionSheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginHorizontal: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + 8,
    paddingTop: spacing.md,
    ...shadows.xl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.3)",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sheetMsgBubble: {
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  sheetMsgText: {
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  actionsContainer: {
    gap: 0,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  actionRowTxt: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    flex: 1,
  },
});

export default ActionSheet;
