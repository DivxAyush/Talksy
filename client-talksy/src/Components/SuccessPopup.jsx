import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6B9D", "#C084FC", "#FB923C"];
const NUM = 28;

export default function SuccessPopup({ visible, title, message, slogan, onAutoClose }) {
 const slideY = useRef(new Animated.Value(400)).current;
 const fade = useRef(new Animated.Value(0)).current;
 const scale = useRef(new Animated.Value(0)).current;
 const sloganFade = useRef(new Animated.Value(0)).current;

 const confetti = useRef(
  Array.from({ length: NUM }, (_, i) => {
   const angle = (i / NUM) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
   const dist = 90 + Math.random() * 140;
   return {
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    rotate: new Animated.Value(0),
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    isRound: Math.random() > 0.5,
    targetX: Math.cos(angle) * dist,
    targetY: Math.sin(angle) * dist - 40,
   };
  })
 ).current;

 useEffect(() => {
  if (!visible) return;

  // Reset
  slideY.setValue(400);
  fade.setValue(0);
  scale.setValue(0);
  sloganFade.setValue(0);
  confetti.forEach((p) => {
   p.x.setValue(0);
   p.y.setValue(0);
   p.opacity.setValue(1);
   p.rotate.setValue(0);
  });

  // ALL animations at once — checkmark appears WITH the popup
  Animated.parallel([
   Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
   Animated.spring(slideY, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
   Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
   Animated.timing(sloganFade, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
   ...confetti.map((p) =>
    Animated.parallel([
     Animated.timing(p.x, { toValue: p.targetX, duration: 800, useNativeDriver: true }),
     Animated.timing(p.y, { toValue: p.targetY, duration: 800, useNativeDriver: true }),
     Animated.timing(p.rotate, { toValue: 4, duration: 800, useNativeDriver: true }),
     Animated.sequence([
      Animated.delay(400),
      Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
     ]),
    ])
   ),
  ]).start();

  // Auto-close after 2.5 seconds
  const timer = setTimeout(() => onAutoClose?.(), 2500);
  return () => clearTimeout(timer);
 }, [visible]);

 if (!visible) return null;

 return (
  <Modal transparent visible statusBarTranslucent animationType="none">
   <View style={s.wrap}>
    <Animated.View style={[s.overlay, { opacity: fade }]} />
    <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
     <View style={s.handle} />

     {/* Confetti */}
     <View style={s.confettiWrap}>
      {confetti.map((p, i) => (
       <Animated.View
        key={i}
        style={{
         position: "absolute",
         width: p.size,
         height: p.size,
         borderRadius: p.isRound ? p.size / 2 : 2,
         backgroundColor: p.color,
         opacity: p.opacity,
         transform: [
          { translateX: p.x },
          { translateY: p.y },
          { rotate: p.rotate.interpolate({ inputRange: [0, 7], outputRange: ["0deg", "720deg"] }) },
         ],
        }}
       />
      ))}
     </View>

     {/* Checkmark */}
     <Animated.View style={[s.circle, { transform: [{ scale }] }]}>
      <Ionicons name="checkmark-sharp" size={38} color="#fff" />
     </Animated.View>

     <Text style={s.title}>{title}</Text>
     <Text style={s.msg}>{message}</Text>

     <Animated.View style={{ opacity: sloganFade }}>
      <Text style={s.slogan}>{slogan || "Let's start chatting! \u{1F4AC}"}</Text>
     </Animated.View>
    </Animated.View>
   </View>
  </Modal>
 );
}

const s = StyleSheet.create({
 wrap: { flex: 1, justifyContent: "flex-end" },
 overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
 sheet: {
  backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
  paddingHorizontal: 28, paddingTop: 14, paddingBottom: 40, alignItems: "center", overflow: "hidden",
 },
 handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", marginBottom: 24 },
 confettiWrap: {
  position: "absolute", top: 80, alignSelf: "center",
  width: 1, height: 1, alignItems: "center", justifyContent: "center",
 },
 circle: {
  width: 80, height: 80, borderRadius: 40, backgroundColor: "#2ecc71",
  justifyContent: "center", alignItems: "center", marginBottom: 20, zIndex: 2,
 },
 title: { fontSize: 22, fontWeight: "800", color: "#1a1a2e", marginBottom: 8 },
 msg: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 16 },
 slogan: { fontSize: 16, fontWeight: "600", color: "#1a1a2e", textAlign: "center" },
});
