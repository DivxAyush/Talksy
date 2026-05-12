import React, { useState, useRef, useCallback, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatContext } from "../../context/ChatContext";
import { formatDuration } from "../../utils/chat/formatters";
import { spacing, radius, bubble } from "../../theme/designTokens";

const VoicePlayer = React.memo(({ item, isMe, accentPurple, textSub }) => {
  const { playAudio, pauseAudio, activeAudioId } = useContext(ChatContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(item.mediaDuration || 0);
  const lastUpdateRef = useRef(0);
  const isMountedRef = useRef(true);

  const isActive = activeAudioId === item._id;

  const onStatusUpdate = useCallback((status) => {
    if (!isMountedRef.current) return; // Prevent state updates after unmount
    if (status.isLoaded) {
      const now = Date.now();
      // Throttle updates to max 10fps (100ms) to reduce render pressure
      if (now - lastUpdateRef.current > 100 || status.didJustFinish) {
        setIsPlaying(status.isPlaying);
        setProgress(status.positionMillis / (status.durationMillis || 1));
        if (status.durationMillis) setDuration(status.durationMillis / 1000);
        lastUpdateRef.current = now;
      }
    } else {
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive]);

  const handleTogglePlay = useCallback(async () => {
    try {
      if (isPlaying && isActive) {
        await pauseAudio();
        setIsPlaying(false);
      } else {
        await playAudio(item.mediaUrl, item._id, onStatusUpdate);
        setIsPlaying(true);
      }
    } catch (err) { console.log("Voice play error:", err); }
  }, [isPlaying, isActive, pauseAudio, playAudio, item.mediaUrl, item._id, onStatusUpdate]);

  // Generate waveform bars (visual only, deterministic from message ID)
  const bars = useRef(
    Array.from({ length: 20 }, (_, i) => {
      const hash = ((item._id || "").charCodeAt(i % (item._id || "x").length) * 7 + i * 13) % 100;
      return 4 + (hash / 100) * 14;
    })
  ).current;

  return (
    <View style={s.voiceBubble}>
      <TouchableOpacity
        onPress={handleTogglePlay}
        style={[s.playBtn, { backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "rgba(168,85,247,0.1)" }]}
        activeOpacity={0.6}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={18} color={isMe ? "#fff" : accentPurple} style={!isPlaying && { marginLeft: 2 }} />
      </TouchableOpacity>
      <View style={s.voiceInfo}>
        {/* Waveform visualization */}
        <View style={s.waveform}>
          {bars.map((h, i) => {
            const isPlayed = progress > 0 && i / bars.length <= progress;
            return (
              <View
                key={i}
                style={[
                  s.waveBar,
                  {
                    height: h,
                    backgroundColor: isPlayed
                      ? (isMe ? "#fff" : accentPurple)
                      : (isMe ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)"),
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[s.voiceDuration, { color: isMe ? "rgba(255,255,255,0.65)" : textSub }]}>
          {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}, (prev, next) => {
  // Only rerender if playback-relevant data changes
  return (
    prev.item._id === next.item._id &&
    prev.item.mediaUrl === next.item.mediaUrl &&
    prev.item.mediaDuration === next.item.mediaDuration &&
    prev.isMe === next.isMe &&
    prev.accentPurple === next.accentPurple &&
    prev.textSub === next.textSub
  );
});

const s = StyleSheet.create({
  voiceBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: spacing.sm + 2,
    width: bubble.voiceWidth,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceInfo: { flex: 1, gap: spacing.xs + 2 },
  waveform: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 1.5,
  },
  waveBar: {
    flex: 1,
    borderRadius: 1,
    minWidth: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});

export default VoicePlayer;
