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
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

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

    // Floating animation for chat bubbles
    const createFloat = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -15, duration: 2500, delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    };
    createFloat(floatAnim1, 0);
    createFloat(floatAnim2, 1250);
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
      
      {/* Decorative Floating Chat Bubbles */}
      <Animated.View style={[styles.floatBubble, styles.bubbleLeft, { transform: [{ translateY: floatAnim1 }], backgroundColor: isDark ? "rgba(196,115,74,0.15)" : "rgba(196,115,74,0.12)" }]} />
      <Animated.View style={[styles.floatBubble, styles.bubbleRight, { transform: [{ translateY: floatAnim2 }], backgroundColor: isDark ? "rgba(196,115,74,0.2)" : "rgba(196,115,74,0.15)" }]} />
      
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

      {/* Wordmark and Tagline */}
      <Animated.View style={[styles.wordmarkWrap, { opacity: wordmarkOpacity }]}>
        <Text style={[styles.wordmark, { color: "#C4734A" }]}>Klyro</Text>
        <Text style={[styles.tagline, { color: isDark ? "#A1A1A6" : "#8E5A55" }]}>Secure • Fast • Connect</Text>
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
    bottom: height * 0.28,
    alignItems: "center",
  },
  wordmark: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  floatBubble: {
    position: "absolute",
    width: 60,
    height: 45,
    borderRadius: 22,
    borderBottomLeftRadius: 5,
  },
  bubbleLeft: {
    top: height * 0.2,
    left: width * 0.15,
    transform: [{ rotate: "-15deg" }],
  },
  bubbleRight: {
    bottom: height * 0.45,
    right: width * 0.12,
    width: 45,
    height: 35,
    borderRadius: 18,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 18,
    transform: [{ rotate: "15deg" }],
  },
});