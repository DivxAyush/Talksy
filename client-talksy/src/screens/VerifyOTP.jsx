import React, { useState, useRef, useEffect } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
 StatusBar, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const PURPLE = "#5B5FC7";
const STATIC_OTP = "1234";

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

 useEffect(() => {
  Animated.parallel([
   Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
   Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
   ...boxAnims.map((anim, i) =>
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay: 200 + i * 100, useNativeDriver: true })
   ),
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
   <StatusBar barStyle="dark-content" backgroundColor="#fff" />
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

    {/* Header */}
    <View style={s.header}>
     <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
      <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
     </TouchableOpacity>
    </View>

    <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
     <Text style={s.title}>Verify Phone</Text>
     <Text style={s.sub}>Code has been sent to {maskedMobile}</Text>

     {/* OTP Boxes */}
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
        <TextInput
         ref={(ref) => (inputs.current[i] = ref)}
         style={[s.otpInput, digit && { color: "#fff" }]}
         value={digit}
         onChangeText={(t) => handleChange(t, i)}
         onKeyPress={(e) => handleKeyPress(e, i)}
         keyboardType="number-pad"
         maxLength={1}
         textContentType="oneTimeCode"
         autoComplete="sms-otp"
        />
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
    </Animated.View>

    {/* Verify Button */}
    <View style={s.bottomWrap}>
     <TouchableOpacity
      style={[s.btn, loading && { opacity: 0.7 }]}
      onPress={handleVerify}
      disabled={loading}
      activeOpacity={0.8}
     >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Verify</Text>}
     </TouchableOpacity>
    </View>

   </KeyboardAvoidingView>
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1, backgroundColor: "#fff" },
 header: {
  paddingTop: Platform.OS === "ios" ? 56 : 48,
  paddingHorizontal: 20, paddingBottom: 10,
 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  borderColor: "#e5e5e5", justifyContent: "center", alignItems: "center",
 },

 content: { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 20 },
 title: { fontSize: 26, fontWeight: "800", color: "#1a1a2e", marginBottom: 10, textAlign: "center" },
 sub: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 40 },

 // OTP Boxes
 otpRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 20 },
 otpBox: {
  width: 58, height: 58, borderRadius: 14,
  borderWidth: 2, borderColor: "#e5e5e5",
  justifyContent: "center", alignItems: "center",
  backgroundColor: "#fafafa",
 },
 otpBoxFilled: {
  backgroundColor: PURPLE, borderColor: PURPLE,
 },
 otpBoxError: {
  borderColor: "#e74c3c",
 },
 otpInput: {
  fontSize: 22, fontWeight: "700", color: "#1a1a2e",
  textAlign: "center", width: "100%", height: "100%",
 },

 err: { color: "#e74c3c", fontSize: 13, marginTop: 8, textAlign: "center" },

 // Resend
 resendRow: { alignItems: "center", marginTop: 28 },
 resendTxt: { fontSize: 14, color: "#888", marginBottom: 6 },
 resendLink: { fontSize: 14, fontWeight: "700", color: PURPLE },

 bottomWrap: { paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 36 : 24 },
 btn: {
  backgroundColor: PURPLE, paddingVertical: 16, borderRadius: 14,
  alignItems: "center",
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
