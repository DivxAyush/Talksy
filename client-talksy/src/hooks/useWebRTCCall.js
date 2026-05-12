import { useState, useEffect, useRef } from 'react';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export const useWebRTCCall = (socket, isCaller, user, incomingSignal, isVideoCall = false) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(isCaller ? "Calling..." : (isVideoCall ? "Incoming Video Call..." : "Incoming Call..."));
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  
  const peerConnection = useRef(null);
  const myIdRef = useRef("");

  useEffect(() => {
    let isMounted = true;
    
    AsyncStorage.getItem("userId").then(id => {
      if (id) myIdRef.current = id;
    });

    const startWebRTC = async () => {
      try {
        // 1. Get Local Media Stream
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall ? { facingMode: "user" } : false,
        });
        
        if (!isMounted) return;
        setLocalStream(stream);

        // 2. Initialize Peer Connection
        peerConnection.current = new RTCPeerConnection(configuration);

        // 3. Add local stream to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });

        // 4. Handle incoming remote stream
        peerConnection.current.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // 5. Setup Socket Listeners for Signaling
        if (socket) {
          // Listen for Answer
          socket.on("call_accepted", async (data) => {
            setCallStatus("Connected");
            if (data?.signal && peerConnection.current) {
              const remoteDesc = new RTCSessionDescription(data.signal);
              await peerConnection.current.setRemoteDescription(remoteDesc);
            }
          });

          // Listen for Call End
          socket.on("call_ended", () => {
            endCall(false);
          });

          // Trickle ICE (If backend supports it, otherwise ignored)
          socket.on("ice_candidate", async (data) => {
            if (data?.candidate && peerConnection.current) {
              try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              } catch (e) { console.log("Error adding ICE candidate", e); }
            }
          });

          peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
              const toId = isCaller ? user._id : incomingSignal?.from;
              socket.emit("ice_candidate", { candidate: event.candidate, to: toId });
            }
          };
        }

        // 6. Initiate Call if Caller
        if (isCaller) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          AsyncStorage.getItem("user").then(uStr => {
            const me = uStr ? JSON.parse(uStr) : {};
            socket.emit("call_user", {
              userToCall: user._id || user.id,
              signalData: offer,
              from: myIdRef.current,
              isVideo: isVideoCall,
              callerName: me.name || me.username || "Klyro User",
              callerPic: me.profilePic || ""
            });
          });
        }
      } catch (err) {
        console.error("Error starting WebRTC:", err);
      }
    };

    startWebRTC();

    return () => {
      isMounted = false;
      endCall(false);
    };
  }, []);

  const acceptCall = async () => {
    if (!incomingSignal || !peerConnection.current) return;
    try {
      // Set Remote Offer
      const remoteDesc = new RTCSessionDescription(incomingSignal.signal);
      await peerConnection.current.setRemoteDescription(remoteDesc);

      // Create Answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      // Send Answer
      socket.emit("answer_call", { signal: answer, to: incomingSignal.from });
      setCallStatus("Connected");
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const endCall = (emit = true) => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (emit && socket) {
      const toId = isCaller ? user._id : incomingSignal?.from;
      if (toId) {
        socket.emit("end_call", { to: toId });
      }
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && isVideoCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const switchCamera = () => {
    if (localStream && isVideoCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
      }
    }
  };

  return {
    localStream,
    remoteStream,
    callStatus,
    isMuted,
    isVideoEnabled,
    acceptCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    endCall
  };
};
