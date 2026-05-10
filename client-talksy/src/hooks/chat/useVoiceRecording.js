import { useState, useRef, useEffect, useCallback } from "react";
import { Vibration } from "react-native";
import { Audio } from "expo-av";

export const useVoiceRecording = (handleMediaUpload) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  
  const isRecordingRef = useRef(false);
  const recordingRef = useRef(null);
  const recordTimerRef = useRef(null);

  const startRecording = useCallback(async () => {
    if (recordingRef.current || isRecordingRef.current) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration(prev => prev + 1), 1000);
      Vibration.vibrate(50);
    } catch (err) {
      console.log("[useVoiceRecording] Start error:", err);
      isRecordingRef.current = false;
      setIsRecording(false);
      recordingRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async (shouldSend = true) => {
    if (!recordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
      return;
    }

    const recording = recordingRef.current;
    recordingRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);
    clearInterval(recordTimerRef.current);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (shouldSend && uri) {
        handleMediaUpload({ uri }, "voice");
      }
    } catch (err) {
      console.log("[useVoiceRecording] Stop error:", err);
    }
  }, [handleMediaUpload]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => { });
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    isRecordingRef,
    recordDuration,
    startRecording,
    stopRecording
  };
};
