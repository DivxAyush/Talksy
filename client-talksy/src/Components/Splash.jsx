import React, { useContext, useEffect, useRef } from "react";
import { View, Image, StyleSheet, StatusBar, Animated, Text, Dimensions } from "react-native";
import { ThemeContext } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function Splash() {
  const { isDark } = useContext(ThemeContext);
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const orbitRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Wordmark fade in after logo
    Animated.timing(wordmarkOpacity, {
      toValue: 1,
      duration: 500,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Subtle orbital rotation
    Animated.loop(
      Animated.timing(orbitRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const orbitSpin = orbitRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bgColor = isDark ? "#121212" : "#F7ECE9";
  const orbitColor = isDark ? "rgba(196, 115, 74, 0.08)" : "rgba(196, 115, 74, 0.1)";
  const orbitColorInner = isDark ? "rgba(196, 115, 74, 0.12)" : "rgba(196, 115, 74, 0.15)";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />
      
      {/* Subtle orbital circles */}
      <Animated.View style={[styles.orbitOuter, { borderColor: orbitColor, transform: [{ rotate: orbitSpin }] }]} />
      <Animated.View style={[styles.orbitInner, { borderColor: orbitColorInner, transform: [{ rotate: orbitSpin }] }]} />
      
      {/* Small orbital dots */}
      <Animated.View style={[styles.orbitDotWrap, { transform: [{ rotate: orbitSpin }] }]}>
        <View style={[styles.orbitDot, { backgroundColor: isDark ? "rgba(196,115,74,0.3)" : "rgba(196,115,74,0.25)" }]} />
      </Animated.View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={isDark ? require("../../assets/KlyroLightLogo.png") : require("../../assets/KlyroLightLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={[styles.wordmarkWrap, { opacity: wordmarkOpacity }]}>
        <Text style={[styles.wordmark, { color: "#C4734A" }]}>Klyro</Text>
      </Animated.View>
    </View>
  );
}

const ORBIT_SIZE = width * 0.85;
const ORBIT_INNER = width * 0.6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orbitOuter: {
    position: "absolute",
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    borderRadius: ORBIT_SIZE / 2,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  orbitInner: {
    position: "absolute",
    width: ORBIT_INNER,
    height: ORBIT_INNER,
    borderRadius: ORBIT_INNER / 2,
    borderWidth: 1,
  },
  orbitDotWrap: {
    position: "absolute",
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4,
  },
  logoWrap: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 90,
    height: 90,
  },
  wordmarkWrap: {
    position: "absolute",
    bottom: height * 0.32,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});