import React from "react";
import { Modal, Pressable, Animated, View, Image, Text, StyleSheet } from "react-native";

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
          backgroundColor: isDark ? "#202c33" : "#fff",
          opacity: popupAnim,
          transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        }]}>
          {displayPic ? (
            <Image source={{ uri: displayPic }} style={s.popupImage} />
          ) : (
            <View style={[s.popupAvatarPlaceholder, { backgroundColor: isDark ? "#2a3942" : "#1a1a2e" }]}>
              <Text style={s.popupAvatarTxt}>{displayName?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={[s.popupName, { color: textMain }]}>{displayName}</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  popupOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  popupCard: {
    width: 260, borderRadius: 20, alignItems: "center",
    paddingBottom: 24, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
  },
  popupImage: { width: 260, height: 260, resizeMode: "cover" },
  popupAvatarPlaceholder: { width: 260, height: 260, justifyContent: "center", alignItems: "center" },
  popupAvatarTxt: { color: "#fff", fontSize: 72, fontWeight: "700" },
  popupName: { fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" },
});

export default ProfilePopup;
