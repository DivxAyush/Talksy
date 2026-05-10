import React from "react";
import { Ionicons } from "@expo/vector-icons";

const StatusTicks = React.memo(({ status }) => {
  if (status === "pending") return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />;
  if (status === "failed") return <Ionicons name="alert-circle" size={16} color="#e74c3c" />;
  if (status === "read") return <Ionicons name="checkmark-done" size={16} color="#53bdeb" />;
  if (status === "delivered") return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.6)" />;
  return <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.6)" />;
});

export default StatusTicks;
