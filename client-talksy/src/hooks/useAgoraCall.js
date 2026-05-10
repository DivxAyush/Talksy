// src/hooks/useAgoraCall.js
import { useState, useEffect, useRef } from 'react';
import { agoraService } from '../services/agoraService';

export const useAgoraCall = (channelName, uid, isVideoCall = false) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const hasJoined = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const initCall = async () => {
      try {
        // App ID would usually come from environment variables or configs
        await agoraService.initialize("41e5efcef53e49939d8bb20a22cde666");
        await agoraService.joinChannel(null, channelName, uid);
        if (isMounted) {
          setIsJoined(true);
          hasJoined.current = true;
        }
      } catch (e) {
        console.error("Agora init error:", e);
      }
    };

    if (channelName && uid) {
      initCall();
    }

    return () => {
      isMounted = false;
      if (hasJoined.current) {
        agoraService.leaveChannel();
        agoraService.destroy();
      }
    };
  }, [channelName, uid]);

  const toggleMute = async () => {
    const newMutedState = !isMuted;
    await agoraService.setMute(newMutedState);
    setIsMuted(newMutedState);
  };

  const toggleVideo = async () => {
    const newVideoState = !isVideoEnabled;
    await agoraService.setVideo(newVideoState);
    setIsVideoEnabled(newVideoState);
  };

  const switchCamera = async () => {
    await agoraService.switchCamera();
  };

  const endCall = async () => {
    await agoraService.leaveChannel();
    setIsJoined(false);
  };

  return {
    isJoined,
    isMuted,
    isVideoEnabled,
    remoteUsers,
    toggleMute,
    toggleVideo,
    switchCamera,
    endCall
  };
};
