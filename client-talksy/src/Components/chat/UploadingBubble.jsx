import React from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius, bubble } from "../../theme/designTokens";

const UploadingBubble = React.memo(({ data, myBubble }) => (
  <View style={[s.bubbleWrap, s.bubbleRight]}>
    <View style={[s.bubble, { backgroundColor: myBubble }]}>
      {data.type === "image" || data.type === "video" ? (
        <View style={s.mediaContainer}>
          <Image source={{ uri: data.uri }} style={[s.bubbleImage, { opacity: 0.5 }]} />
          <View style={s.uploadOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <View style={s.progressBarWrap}>
              <View style={[s.progressBar, { width: `${Math.round(data.progress * 100)}%` }]} />
            </View>
          </View>
        </View>
      ) : (
        <View style={s.voiceBubble}>
          <View style={s.voiceIconWrap}>
            <Ionicons name="mic" size={20} color="#fff" />
          </View>
          <View style={s.voiceProgressWrap}>
            <View style={s.progressBarWrap}>
              <View style={[s.progressBar, { width: `${Math.round(data.progress * 100)}%` }]} />
            </View>
          </View>
        </View>
      )}
    </View>
  </View>
));

const s = StyleSheet.create({
  bubbleWrap: {
    marginBottom: spacing.sm,
    maxWidth: "78%",
    alignSelf: "flex-end",
  },
  bubble: {
    padding: spacing.xs,
    borderRadius: radius.card,
  },
  mediaContainer: {
    width: bubble.mediaDimension,
    height: bubble.mediaDimension,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  bubbleImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  progressBarWrap: {
    width: "70%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  voiceBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: spacing.sm + 2,
    width: bubble.voiceWidth,
  },
  voiceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceProgressWrap: { flex: 1 },
});

export default UploadingBubble;
