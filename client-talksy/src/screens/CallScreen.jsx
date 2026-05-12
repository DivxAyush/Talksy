import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SocketContext } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAgoraCall } from "../hooks/useAgoraCall";

export default function CallScreen({ route, navigation }) {
  const { user, isCaller, incomingSignal } = route.params;
  const { socket } = useContext(SocketContext);
  
  const [callStatus, setCallStatus] = useState(isCaller ? "Calling..." : "Incoming Call...");
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const [myId, setMyId] = useState("");
  const channelName = isCaller ? `call_${Date.now()}` : incomingSignal?.signal?.channel || "default_channel";

  // Use the Agora Call Hook (mocked for Expo Go compatibility)
  const { isMuted, toggleMute, endCall: agoraEndCall } = useAgoraCall(
    channelName, 
    myId ? parseInt(myId.slice(-6), 16) : 0, 
    false
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
        startTimer();
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
            isVideo: false,
            callerName: me.name || me.username || "Klyro User",
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
    startTimer();
  };

  const endCall = (emit = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    agoraEndCall();
    
    if (emit && socket) {
      const toId = isCaller ? user._id : incomingSignal?.from;
      if (toId) {
        socket.emit("end_call", { to: toId });
      }
    }
    navigation.goBack();
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
    <LinearGradient colors={['#111928', '#1C1C1E']} style={s.container}>
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
            <View style={[s.avatar, { backgroundColor: "#C4734A", justifyContent: "center", alignItems: "center" }]}>
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
    shadowColor: "#C4734A", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 
  },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: "#C4734A" },
  name: { fontSize: 28, color: "#fff", fontWeight: "600", marginTop: 24 },
  duration: { fontSize: 18, color: "#fff", opacity: 0.8, marginTop: 8 },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 30, paddingBottom: 60 },
  btn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  btnEnd: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#e74c3c", justifyContent: "center", alignItems: "center", shadowColor: "#e74c3c", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
});
