import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView
} from "react-native-webrtc";
import { SocketContext } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VideoCallScreen({ route, navigation }) {
  const { user, isCaller, incomingSignal } = route.params;
  const { socket } = useContext(SocketContext);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(isCaller ? "Calling..." : "Incoming Video Call...");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [cameraType, setCameraType] = useState('front');
  
  const pcRef = useRef(null);
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
      const sourceInfos = await mediaDevices.enumerateDevices();
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === "videoinput" && sourceInfo.facing === (cameraType === 'front' ? "front" : "environment")) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: (cameraType === 'front' ? "user" : "environment"),
          deviceId: videoSourceId
        }
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

      if (socket) {
        socket.on("call_accepted", async (signal) => {
          setCallStatus("Connected");
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
            isVideo: true,
            callerName: "Talksy User",
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
    } catch (err) {
      console.log("Accept call error:", err);
    }
  };

  const endCall = (emit = true) => {
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

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
      setCameraType(cameraType === 'front' ? 'back' : 'front');
    }
  };

  return (
    <View style={s.container}>
      {remoteStream && callStatus === "Connected" ? (
        <RTCView streamURL={remoteStream.toURL()} style={s.remoteVideo} objectFit="cover" />
      ) : (
        <View style={s.callingWrap}>
          <Text style={s.callText}>{callStatus}</Text>
          <Text style={s.nameText}>{user?.name || user?.username || "User"}</Text>
        </View>
      )}

      {localStream && (
        <View style={s.localVideoWrap}>
          <RTCView streamURL={localStream.toURL()} style={s.localVideo} objectFit="cover" mirror={cameraType === 'front'} />
        </View>
      )}

      <View style={s.controls}>
        <TouchableOpacity onPress={switchCamera} style={s.btn}>
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleVideo} style={[s.btn, isVideoOff && { backgroundColor: "#fff" }]}>
          <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={isVideoOff ? "#000" : "#fff"} />
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
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  remoteVideo: { flex: 1 },
  callingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  callText: { fontSize: 18, color: "#fff", opacity: 0.8, marginBottom: 10 },
  nameText: { fontSize: 32, color: "#fff", fontWeight: "600" },
  localVideoWrap: { 
    position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60, right: 20,
    width: 100, height: 150, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "#fff",
    elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
  },
  localVideo: { flex: 1 },
  controls: { 
    position: "absolute", bottom: 40, left: 0, right: 0, 
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 
  },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  btnEnd: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e74c3c", justifyContent: "center", alignItems: "center", elevation: 5 },
});
