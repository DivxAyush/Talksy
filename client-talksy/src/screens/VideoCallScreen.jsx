import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SocketContext } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAgoraCall } from "../hooks/useAgoraCall";

export default function VideoCallScreen({ route, navigation }) {
  const { user, isCaller, incomingSignal } = route.params;
  const { socket } = useContext(SocketContext);
  
  const [callStatus, setCallStatus] = useState(isCaller ? "Calling..." : "Incoming Video Call...");
  const [myId, setMyId] = useState("");
  const channelName = isCaller ? `call_video_${Date.now()}` : incomingSignal?.signal?.channel || "default_channel";

  // Use the Agora Call Hook (mocked for Expo Go compatibility)
  const { 
    isMuted, 
    isVideoEnabled, 
    toggleMute, 
    toggleVideo, 
    switchCamera, 
    endCall: agoraEndCall 
  } = useAgoraCall(
    channelName, 
    myId ? parseInt(myId.slice(-6), 16) : 0, 
    true
  );

  useEffect(() => {
    AsyncStorage.getItem("userId").then(id => {
      setMyId(id);
      setupCall(id, channelName);
    });
    
    return () => {
      endCall(false);
    };
  }, []);

  const setupCall = (currentUserId, channel) => {
    if (socket) {
      socket.on("call_accepted", () => {
        setCallStatus("Connected");
      });

      socket.on("call_ended", () => {
        endCall(false);
      });
    }

    if (isCaller) {
      if (socket) {
        AsyncStorage.getItem("user").then(uStr => {
          const me = uStr ? JSON.parse(uStr) : {};
          socket.emit("call_user", {
            userToCall: user._id || user.id,
            signalData: { channel },
            from: currentUserId,
            isVideo: true,
            callerName: me.name || me.username || "Talksy User",
            callerPic: me.profilePic || ""
          });
        });
      }
    }
  };

  const acceptCall = () => {
    if (!incomingSignal) return;
    if (socket) {
      socket.emit("answer_call", { signal: { channel: channelName }, to: incomingSignal.from });
    }
    setCallStatus("Connected");
  };

  const endCall = (emit = true) => {
    agoraEndCall();
    
    if (emit && socket) {
      const toId = isCaller ? user._id : incomingSignal?.from;
      if (toId) {
        socket.emit("end_call", { to: toId });
      }
    }
    navigation.goBack();
  };

  return (
    <View style={s.container}>
      {callStatus === "Connected" ? (
        <View style={s.remoteVideoMock}>
          <Ionicons name="videocam" size={64} color="rgba(255,255,255,0.2)" />
          <Text style={s.mockText}>Remote Video (Agora Ready)</Text>
          <Text style={s.mockSubText}>Eject to Development Client for full video</Text>
        </View>
      ) : (
        <View style={s.callingWrap}>
          <Text style={s.callText}>{callStatus}</Text>
          <Text style={s.nameText}>{user?.name || user?.username || "User"}</Text>
        </View>
      )}

      {isVideoEnabled && (
        <View style={s.localVideoWrap}>
          <View style={s.localVideoMock}>
            <Ionicons name="person" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={s.mockTextLocal}>Local</Text>
          </View>
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
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  remoteVideoMock: { flex: 1, backgroundColor: "#202c33", justifyContent: "center", alignItems: "center" },
  mockText: { color: "#fff", opacity: 0.8, fontSize: 18, marginTop: 16 },
  mockSubText: { color: "#fff", opacity: 0.5, fontSize: 14, marginTop: 8 },
  callingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  callText: { fontSize: 18, color: "#fff", opacity: 0.8, marginBottom: 10 },
  nameText: { fontSize: 32, color: "#fff", fontWeight: "600" },
  localVideoWrap: { 
    position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60, right: 20,
    width: 100, height: 150, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "#fff",
    elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
  },
  localVideoMock: { flex: 1, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  mockTextLocal: { color: "#fff", opacity: 0.6, fontSize: 14, marginTop: 4 },
  controls: { 
    position: "absolute", bottom: 40, left: 0, right: 0, 
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 
  },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  btnEnd: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e74c3c", justifyContent: "center", alignItems: "center", elevation: 5 },
});
