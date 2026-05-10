import React from "react";
import { View, Modal, TouchableOpacity, Image, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MediaViewer = ({ mediaViewer, setMediaViewer }) => {
  return (
    <Modal visible={!!mediaViewer} transparent animationType="fade">
      <View style={s.viewerOverlay}>
        <TouchableOpacity style={s.viewerClose} onPress={() => setMediaViewer(null)}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
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
        {mediaViewer?.caption && (
          <View style={s.viewerCaption}>
            <Text style={s.viewerCaptionTxt}>{mediaViewer.caption}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  viewerOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
  viewerCaption: { position: "absolute", bottom: 50, left: 20, right: 20, padding: 15, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12 },
  viewerCaptionTxt: { color: "#fff", fontSize: 15, textAlign: "center" },
});

export default MediaViewer;
