import React, { useState, useRef, useCallback, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatContext } from "../../context/ChatContext";
import { formatDuration } from "../../utils/chat/formatters";

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

  return (
    <View style={s.voiceBubble}>
      <TouchableOpacity onPress={handleTogglePlay} style={[s.playBtn, { backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(168,85,247,0.1)" }]}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={isMe ? "#fff" : accentPurple} />
      </TouchableOpacity>
      <View style={s.voiceInfo}>
        <View style={s.waveform}>
          <View style={[s.progressLine, { width: `${progress * 100}%`, backgroundColor: isMe ? "#fff" : accentPurple }]} />
          <View style={[s.bgLine, { backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)" }]} />
        </View>
        <Text style={[s.voiceDuration, { color: isMe ? "rgba(255,255,255,0.7)" : textSub }]}>
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
  voiceBubble: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, gap: 10, width: 200 },
  playBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  voiceInfo: { flex: 1, gap: 6 },
  waveform: { height: 4, justifyContent: "center" },
  bgLine: { ...StyleSheet.absoluteFillObject, height: 4, borderRadius: 2 },
  progressLine: { height: 4, borderRadius: 2, zIndex: 1 },
  voiceDuration: { fontSize: 11 },
});

export default VoicePlayer;
