import React from "react";
import { Modal, Pressable, Animated, View, Image, Text, StyleSheet } from "react-native";
import { spacing, radius, shadows, avatarSize } from "../../theme/designTokens";

const ProfilePopup = ({
  popupVisible,
  popupAnim,
  setPopupVisible,
  displayPic,
  displayName,
  isDark,
  textMain
}) => {
  const closePopup = () => {
    Animated.timing(popupAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setPopupVisible(false));
  };

  return (
    <Modal visible={popupVisible} transparent animationType="none" onRequestClose={closePopup}>
      <Pressable style={s.popupOverlay} onPress={closePopup}>
        <Animated.View style={[s.popupBackdrop, { opacity: popupAnim }]} />
        <Animated.View style={[s.popupCard, {
          backgroundColor: isDark ? "#1C1C1E" : "#fff",
          opacity: popupAnim,
          transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
        }]}>
          {displayPic ? (
            <Image source={{ uri: displayPic }} style={s.popupImage} />
          ) : (
            <View style={[s.popupAvatarPlaceholder, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
              <Text style={s.popupAvatarTxt}>{displayName?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <View style={s.nameContainer}>
            <Text style={[s.popupName, { color: textMain }]}>{displayName}</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  popupCard: {
    width: avatarSize.popup,
    borderRadius: radius.xl,
    alignItems: "center",
    overflow: "hidden",
    ...shadows.xl,
  },
  popupImage: { width: avatarSize.popup, height: avatarSize.popup, resizeMode: "cover" },
  popupAvatarPlaceholder: {
    width: avatarSize.popup,
    height: avatarSize.popup,
    justifyContent: "center",
    alignItems: "center",
  },
  popupAvatarTxt: { color: "#fff", fontSize: 72, fontWeight: "700" },
  nameContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  popupName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default ProfilePopup;
