import React, { useRef, useEffect } from "react";
import { View, Modal, TouchableOpacity, Image, Text, StyleSheet, Dimensions, Animated, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { spacing, radius } from "../../theme/designTokens";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MediaViewer = ({ mediaViewer, setMediaViewer }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (mediaViewer) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }),
      ]).start();
    }
  }, [mediaViewer]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setMediaViewer(null);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    });
  };

  return (
    <Modal visible={!!mediaViewer} transparent animationType="none" onRequestClose={handleClose}>
      <StatusBar hidden />
      <Animated.View style={[s.viewerOverlay, { opacity: fadeAnim }]}>
        {/* Close button */}
        <TouchableOpacity style={s.viewerClose} onPress={handleClose} activeOpacity={0.7}>
          <View style={s.closeCircle}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Media content */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {mediaViewer?.type === "image" && (
            <Image source={{ uri: mediaViewer.url }} style={s.fullImage} resizeMode="contain" />
          )}
          {mediaViewer?.type === "video" && (
            <Video
              source={{ uri: mediaViewer.url }}
              style={s.fullImage}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          )}
        </Animated.View>

        {/* Caption */}
        {mediaViewer?.caption ? (
          <Animated.View style={[s.viewerCaption, { opacity: fadeAnim }]}>
            <Text style={s.viewerCaptionTxt}>{mediaViewer.caption}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Modal>
  );
};

const s = StyleSheet.create({
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: spacing.xl,
    zIndex: 10,
  },
  closeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 },
  viewerCaption: {
    position: "absolute",
    bottom: 60,
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.card,
  },
  viewerCaptionTxt: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default MediaViewer;
