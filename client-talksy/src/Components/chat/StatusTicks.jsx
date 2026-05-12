import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const StatusTicks = React.memo(({ status }) => {
  if (status === "failed")
    return <Ionicons name="alert-circle" size={15} color="#e74c3c" />;
  if (status === "read")
    return <Ionicons name="checkmark-done" size={15} color="#C4734A" />;
  if (status === "delivered")
    return (
      <Ionicons
        name="checkmark-done"
        size={15}
        color="rgba(255,255,255,0.55)"
      />
    );
  // 'pending' (queued locally) and 'sent' (on server) both show single tick per requirements
  return (
    <Ionicons name="checkmark" size={15} color="rgba(255,255,255,0.55)" />
  );
});

export default StatusTicks;
