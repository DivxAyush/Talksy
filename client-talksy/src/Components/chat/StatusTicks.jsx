import React from "react";
import { Ionicons } from "@expo/vector-icons";

const StatusTicks = React.memo(({ status }) => {
  if (status === "failed") return <Ionicons name="alert-circle" size={16} color="#e74c3c" />;
  if (status === "read") return <Ionicons name="checkmark-done" size={16} color="#53bdeb" />;
  if (status === "delivered") return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.6)" />;
  // 'pending' (queued locally) and 'sent' (on server) both show single tick per requirements
  return <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.6)" />;
});

export default StatusTicks;
