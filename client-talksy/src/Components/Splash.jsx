import React from "react";
import { View, ImageBackground, StyleSheet, ActivityIndicator, StatusBar } from "react-native";

export default function Splash() {
  return (
    <ImageBackground
      source={require("../../assets/TalksySS.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <ActivityIndicator size="large" color="#fff" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});