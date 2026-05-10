import React from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UploadingBubble = ({ data, myBubble }) => (
  <View style={[s.bubbleWrap, s.bubbleRight]}>
    <View style={[s.bubble, { backgroundColor: myBubble, padding: 4, borderRadius: 12 }]}>
      {data.type === "image" || data.type === "video" ? (
        <View style={s.mediaContainer}>
          <Image source={{ uri: data.uri }} style={[s.bubbleImage, { opacity: 0.6 }]} />
          <View style={s.uploadOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <View style={s.progressBarWrap}>
              <View style={[s.progressBar, { width: `${data.progress * 100}%` }]} />
            </View>
          </View>
        </View>
      ) : (
        <View style={s.voiceBubble}>
          <Ionicons name="mic" size={24} color="#fff" />
          <View style={s.progressBarWrap}>
            <View style={[s.progressBar, { width: `${data.progress * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  </View>
);

const s = StyleSheet.create({
  bubbleWrap: { marginBottom: 6, maxWidth: "78%", alignSelf: "flex-end" },
  bubble: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, borderRadius: 18 },
  mediaContainer: { width: 220, height: 220, borderRadius: 10, overflow: "hidden", marginBottom: 4 },
  bubbleImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  progressBarWrap: { width: "70%", height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#fff" },
  voiceBubble: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, gap: 10, width: 200 },
});

export default UploadingBubble;
