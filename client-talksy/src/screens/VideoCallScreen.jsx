import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SocketContext } from "../context/SocketContext";
import { RTCView } from "react-native-webrtc";
import { useWebRTCCall } from "../hooks/useWebRTCCall";

export default function VideoCallScreen({ route, navigation }) {
  const { user, isCaller, incomingSignal } = route.params;
  const { socket } = useContext(SocketContext);
  
  // Use the real WebRTC Hook
  const { 
    localStream,
    remoteStream,
    callStatus,
    isMuted, 
    isVideoEnabled, 
    toggleMute, 
    toggleVideo, 
    switchCamera, 
    acceptCall: rtcAcceptCall,
    endCall: rtcEndCall 
  } = useWebRTCCall(
    socket,
    isCaller,
    user,
    incomingSignal,
    true
  );

  const acceptCall = () => {
    rtcAcceptCall();
  };

  const endCall = (emit = true) => {
    rtcEndCall(emit);
    navigation.goBack();
  };

  return (
    <View style={s.container}>
      {callStatus === "Connected" && remoteStream ? (
        <RTCView 
          streamURL={remoteStream.toURL()} 
          style={s.remoteVideo} 
          objectFit="cover" 
        />
      ) : (
        <View style={s.callingWrap}>
          <Text style={s.callText}>{callStatus}</Text>
          <Text style={s.nameText}>{user?.name || user?.username || "User"}</Text>
        </View>
      )}

      {isVideoEnabled && localStream && (
        <View style={s.localVideoWrap}>
          <RTCView 
            streamURL={localStream.toURL()} 
            style={s.localVideo} 
            objectFit="cover" 
          />
        </View>
      )}

      <View style={s.controls}>
        <TouchableOpacity onPress={switchCamera} style={s.btn}>
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleVideo} style={[s.btn, !isVideoEnabled && { backgroundColor: "#fff" }]}>
          <Ionicons name={!isVideoEnabled ? "videocam-off" : "videocam"} size={28} color={!isVideoEnabled ? "#000" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleMute} style={[s.btn, isMuted && { backgroundColor: "#fff" }]}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#000" : "#fff"} />
        </TouchableOpacity>
        
        {!isCaller && callStatus === "Incoming Video Call..." && (
          <TouchableOpacity onPress={acceptCall} style={[s.btnEnd, { backgroundColor: "#2ecc71" }]}>
            <Ionicons name="videocam" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => endCall(true)} style={s.btnEnd}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1C1C1E" },
  remoteVideo: { flex: 1 },
  callingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  callText: { fontSize: 18, color: "#fff", opacity: 0.8, marginBottom: 10 },
  nameText: { fontSize: 32, color: "#fff", fontWeight: "600" },
  localVideoWrap: { 
    position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60, right: 20,
    width: 100, height: 150, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "#fff",
    elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
  },
  localVideo: { flex: 1, backgroundColor: "#333" },
  controls: { 
    position: "absolute", bottom: 40, left: 0, right: 0, 
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 
  },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  btnEnd: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e74c3c", justifyContent: "center", alignItems: "center", elevation: 5 },
});
