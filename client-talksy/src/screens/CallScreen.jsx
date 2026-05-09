import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";
import { SocketContext } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CallScreen({ route, navigation }) {
  const { user, isCaller, incomingSignal } = route.params;
  const { socket } = useContext(SocketContext);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(isCaller ? "Calling..." : "Incoming Call...");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  const pcRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("userId").then(id => {
      setMyId(id);
      setupWebRTC(id);
    });
    
    return () => {
      endCall(false);
    };
  }, []);

  const setupWebRTC = async (currentUserId) => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      setLocalStream(stream);

      const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice_candidate", {
            to: isCaller ? user._id : incomingSignal?.from,
            candidate: event.candidate
          });
        }
      };

      // Register socket listeners
      if (socket) {
        socket.on("call_accepted", async (signal) => {
          setCallStatus("Connected");
          startTimer();
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        });

        socket.on("ice_candidate", async (candidate) => {
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socket.on("call_ended", () => {
          endCall(false);
        });
      }

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          socket.emit("call_user", {
            userToCall: user._id,
            signalData: offer,
            from: currentUserId,
            isVideo: false,
            callerName: "Talksy User", // Ideally fetched from context
            callerPic: ""
          });
        }
      } else if (incomingSignal) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.signal));
      }

    } catch (err) {
      console.log("WebRTC setup error:", err);
    }
  };

  const acceptCall = async () => {
    if (!pcRef.current || !incomingSignal) return;
    try {
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      if (socket) {
        socket.emit("answer_call", { signal: answer, to: incomingSignal.from });
      }
      setCallStatus("Connected");
      startTimer();
    } catch (err) {
      console.log("Accept call error:", err);
    }
  };

  const endCall = (emit = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (emit && socket) {
      const toId = isCaller ? user._id : incomingSignal?.from;
      if (toId) {
        socket.emit("end_call", { to: toId });
      }
    }
    navigation.goBack();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <LinearGradient colors={['#111928', '#202c33']} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => endCall(true)} style={s.backBtn}>
          <Ionicons name="chevron-down" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerStatus}>{callStatus}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.body}>
        <View style={s.avatarContainer}>
          {user?.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: "#a855f7", justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 64, color: "#fff", fontWeight: "700" }}>
                {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={s.name}>{user?.name || user?.username || "User"}</Text>
        {callStatus === "Connected" && (
          <Text style={s.duration}>{formatDuration(callDuration)}</Text>
        )}
      </View>

      <View style={s.controls}>
        <TouchableOpacity onPress={toggleMute} style={[s.btn, isMuted && { backgroundColor: "#fff" }]}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#000" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSpeaker(!isSpeaker)} style={[s.btn, isSpeaker && { backgroundColor: "#fff" }]}>
          <Ionicons name={isSpeaker ? "volume-high" : "volume-medium"} size={28} color={isSpeaker ? "#000" : "#fff"} />
        </TouchableOpacity>
        
        {!isCaller && callStatus === "Incoming Call..." && (
          <TouchableOpacity onPress={acceptCall} style={[s.btnEnd, { backgroundColor: "#2ecc71" }]}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => endCall(true)} style={s.btnEnd}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, alignItems: "center" },
  headerStatus: { color: "#fff", fontSize: 16, opacity: 0.8 },
  body: { alignItems: "center", flex: 1, justifyContent: "center", marginTop: -60 },
  avatarContainer: { 
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 
  },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: "#25D366" },
  name: { fontSize: 28, color: "#fff", fontWeight: "600", marginTop: 24 },
  duration: { fontSize: 18, color: "#fff", opacity: 0.8, marginTop: 8 },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 30, paddingBottom: 60 },
  btn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  btnEnd: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#e74c3c", justifyContent: "center", alignItems: "center", shadowColor: "#e74c3c", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
});
