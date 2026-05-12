import React, { useState, useRef, useEffect } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
 StatusBar, Alert, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const COPPER = "#C4734A";
const STATIC_OTP = "1234";

// ─── Animated OTP Digit Component ───
const AnimatedDigit = ({ digit, isFilled, hasError }) => {
 const slideAnim = useRef(new Animated.Value(digit ? 0 : 30)).current;
 const opacityAnim = useRef(new Animated.Value(digit ? 1 : 0)).current;
 const prevDigit = useRef(digit);

 useEffect(() => {
  if (digit && !prevDigit.current) {
   // Digit entered — slide UP from below
   slideAnim.setValue(28);
   opacityAnim.setValue(0);
   Animated.parallel([
    Animated.spring(slideAnim, {
     toValue: 0, tension: 120, friction: 8, useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
     toValue: 1, duration: 150, useNativeDriver: true,
    }),
   ]).start();
  } else if (!digit && prevDigit.current) {
   // Digit removed — slide DOWN and fade out
   Animated.parallel([
    Animated.timing(slideAnim, {
     toValue: -24, duration: 150, useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
     toValue: 0, duration: 120, useNativeDriver: true,
    }),
   ]).start();
  }
  prevDigit.current = digit;
 }, [digit]);

 if (!digit) return null;

 return (
  <Animated.Text
   style={[
    s.digitText,
    {
     transform: [{ translateY: slideAnim }],
     opacity: opacityAnim,
    },
   ]}
  >
   {digit}
  </Animated.Text>
 );
};

export default function VerifyOTP() {
 const [otp, setOtp] = useState(["", "", "", ""]);
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const [timer, setTimer] = useState(30);
 const [canResend, setCanResend] = useState(false);

 const inputs = useRef([]);
 const nav = useNavigation();
 const route = useRoute();
 const { mobile, flow } = route.params; // flow: "forgot" or "settings"

 // Animations
 const fadeAnim = useRef(new Animated.Value(0)).current;
 const slideAnim = useRef(new Animated.Value(30)).current;
 const boxAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
 const shakeAnim = useRef(new Animated.Value(0)).current;
 const btnAnim = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  Animated.parallel([
   Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
   Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
   ...boxAnims.map((anim, i) =>
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay: 200 + i * 100, useNativeDriver: true })
   ),
   Animated.spring(btnAnim, { toValue: 1, tension: 50, friction: 8, delay: 600, useNativeDriver: true }),
  ]).start();

  // Focus first input
  setTimeout(() => inputs.current[0]?.focus(), 500);
 }, []);

 // Countdown timer
 useEffect(() => {
  if (timer <= 0) {
   setCanResend(true);
   return;
  }
  const interval = setInterval(() => setTimer(t => t - 1), 1000);
  return () => clearInterval(interval);
 }, [timer]);

 const handleChange = (text, index) => {
  const newOtp = [...otp];
  // Handle paste - if text is more than 1 char
  if (text.length > 1) {
   const chars = text.replace(/\D/g, "").split("").slice(0, 4);
   chars.forEach((c, i) => { if (i < 4) newOtp[i] = c; });
   setOtp(newOtp);
   const lastIdx = Math.min(chars.length - 1, 3);
   inputs.current[lastIdx]?.focus();
   return;
  }

  newOtp[index] = text.replace(/\D/g, "");
  setOtp(newOtp);
  setError("");

  if (text && index < 3) {
   inputs.current[index + 1]?.focus();
  }
 };

 const handleKeyPress = (e, index) => {
  if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
   inputs.current[index - 1]?.focus();
   const newOtp = [...otp];
   newOtp[index - 1] = "";
   setOtp(newOtp);
  }
 };

 const shakeBoxes = () => {
  Animated.sequence([
   Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
   Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
   Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
   Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
   Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
 };

 const handleVerify = () => {
  const code = otp.join("");
  if (code.length !== 4) {
   setError("Please enter 4-digit OTP");
   shakeBoxes();
   return;
  }

  if (code !== STATIC_OTP) {
   setError("Invalid OTP. Try 1234");
   shakeBoxes();
   setOtp(["", "", "", ""]);
   inputs.current[0]?.focus();
   return;
  }

  // OTP verified — navigate to change password
  nav.navigate("ChangePassword", { mobile, flow });
 };

 const handleResend = () => {
  if (!canResend) return;
  setCanResend(false);
  setTimer(30);
  setOtp(["", "", "", ""]);
  inputs.current[0]?.focus();
  Alert.alert("OTP Sent", "A new OTP has been sent to your number. (Use 1234)");
 };

 const maskedMobile = `+91 ${mobile.slice(0, 2)}****${mobile.slice(-4)}`;

 return (
  <View style={s.container}>
   <StatusBar barStyle="dark-content" backgroundColor="#F7ECE9" />
   <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
   >
    <ScrollView
     contentContainerStyle={s.scrollContent}
     keyboardShouldPersistTaps="handled"
     showsVerticalScrollIndicator={false}
     bounces={false}
    >
     {/* Header */}
     <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
       <Ionicons name="arrow-back" size={22} color="#2B1F1A" />
      </TouchableOpacity>
     </View>

     <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={s.title}>Verify Phone</Text>
      <Text style={s.sub}>Code has been sent to {maskedMobile}</Text>

      {/* OTP Boxes with Animated Digits */}
      <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
       {otp.map((digit, i) => (
        <Animated.View
         key={i}
         style={[
          s.otpBox,
          digit ? s.otpBoxFilled : null,
          error ? s.otpBoxError : null,
          {
           transform: [{ scale: boxAnims[i] }],
          },
         ]}
        >
         {/* Hidden real input */}
         <TextInput
          ref={(ref) => (inputs.current[i] = ref)}
          style={s.hiddenInput}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden={true}
         />
         {/* Animated digit display */}
         <View style={s.digitWrap} pointerEvents="none">
          <AnimatedDigit digit={digit} isFilled={!!digit} hasError={!!error} />
         </View>
        </Animated.View>
       ))}
      </Animated.View>

      {error ? <Text style={s.err}>{error}</Text> : null}

      {/* Resend */}
      <View style={s.resendRow}>
       <Text style={s.resendTxt}>Didn't get OTP Code?</Text>
       <TouchableOpacity onPress={handleResend} disabled={!canResend}>
        <Text style={[s.resendLink, !canResend && { opacity: 0.4 }]}>
         {canResend ? "Resend Code" : `Resend in ${timer}s`}
        </Text>
       </TouchableOpacity>
      </View>

      {/* Verify Button — right after resend, stays visible with keyboard */}
      <Animated.View style={[s.btnWrap, { transform: [{ scale: btnAnim }] }]}>
       <TouchableOpacity
        style={[s.btn, loading && { opacity: 0.7 }]}
        onPress={handleVerify}
        disabled={loading}
        activeOpacity={0.8}
       >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Verify</Text>}
       </TouchableOpacity>
      </Animated.View>
     </Animated.View>
    </ScrollView>
   </KeyboardAvoidingView>
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1, backgroundColor: "#F7ECE9" },
 scrollContent: { flexGrow: 1 },
 header: {
  paddingTop: Platform.OS === "ios" ? 56 : 48,
  paddingHorizontal: 20, paddingBottom: 10,
 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  borderColor: "#F1D7D1", justifyContent: "center", alignItems: "center",
 },

 content: { paddingHorizontal: 24, alignItems: "center", paddingTop: 20 },
 title: { fontSize: 26, fontWeight: "800", color: "#2B1F1A", marginBottom: 10, textAlign: "center" },
 sub: { fontSize: 14, color: "#8E5A55", textAlign: "center", lineHeight: 20, marginBottom: 36 },

 // OTP Boxes
 otpRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 16 },
 otpBox: {
  width: 58, height: 58, borderRadius: 14,
  borderWidth: 2, borderColor: "#F1D7D1",
  justifyContent: "center", alignItems: "center",
  backgroundColor: "#FFF5F2",
  overflow: "hidden",
 },
 otpBoxFilled: {
  backgroundColor: COPPER, borderColor: COPPER,
 },
 otpBoxError: {
  borderColor: "#e74c3c",
 },

 // Hidden input on top of the box
 hiddenInput: {
  ...StyleSheet.absoluteFillObject,
  fontSize: 22, fontWeight: "700", color: "transparent",
  textAlign: "center", opacity: 0,
 },

 // Animated digit overlay
 digitWrap: {
  ...StyleSheet.absoluteFillObject,
  justifyContent: "center", alignItems: "center",
 },
 digitText: {
  fontSize: 22, fontWeight: "700", color: "#fff",
 },

 err: { color: "#e74c3c", fontSize: 13, marginTop: 4, textAlign: "center" },

 // Resend
 resendRow: { alignItems: "center", marginTop: 24 },
 resendTxt: { fontSize: 14, color: "#8E5A55", marginBottom: 6 },
 resendLink: { fontSize: 14, fontWeight: "700", color: COPPER },

 // Verify Button
 btnWrap: { width: "100%", marginTop: 32, paddingBottom: 24 },
 btn: {
  backgroundColor: COPPER, paddingVertical: 16, borderRadius: 14,
  alignItems: "center",
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
