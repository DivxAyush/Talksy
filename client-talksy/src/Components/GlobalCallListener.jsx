import React, { useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export default function GlobalCallListener({ navigationRef }) {
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (!socket || !navigationRef) return;

    const handleIncomingCall = (data) => {
      // data: { signal, from, isVideo, callerName, callerPic }
      if (navigationRef.current) {
        if (data.isVideo) {
          navigationRef.current.navigate("VideoCallScreen", {
            user: { _id: data.from, name: data.callerName, profilePic: data.callerPic },
            isCaller: false,
            incomingSignal: data
          });
        } else {
          navigationRef.current.navigate("CallScreen", {
            user: { _id: data.from, name: data.callerName, profilePic: data.callerPic },
            isCaller: false,
            incomingSignal: data
          });
        }
      }
    };

    socket.on("call_user", handleIncomingCall);

    return () => {
      socket.off("call_user", handleIncomingCall);
    };
  }, [socket, navigationRef]);

  return null;
}
