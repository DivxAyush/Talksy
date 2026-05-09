import React, { useState, useRef } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
 StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API = "https://talksy-3py1.onrender.com/api/users";
const PURPLE = "#5B5FC7";
const PURPLE_LIGHT = "#7C7FE0";
const PURPLE_BG = "#F0F0FF";

export default function ForgotPassword() {
 const [mobile, setMobile] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const nav = useNavigation();

 // Animation
 const fadeAnim = useRef(new Animated.Value(0)).current;
 const slideAnim = useRef(new Animated.Value(30)).current;

 React.useEffect(() => {
  Animated.parallel([
   Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
   Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
  ]).start();
 }, []);

 const handleNext = async () => {
  if (!/^\d{10}$/.test(mobile)) {
   setError("Enter valid 10-digit mobile number");
   return;
  }

  try {
   setLoading(true);
   setError("");
   const { data } = await axios.post(`${API}/check-mobile`, { mobile });
   if (data.success) {
    nav.navigate("VerifyOTP", { mobile, flow: "forgot" });
   }
  } catch (err) {
   setError(err?.response?.data?.message || "Mobile number not found");
  } finally {
   setLoading(false);
  }
 };

 return (
  <View style={s.container}>
   <StatusBar barStyle="dark-content" backgroundColor="#fff" />
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

    {/* Header */}
    <View style={s.header}>
     <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
      <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
     </TouchableOpacity>
     <View style={s.logoRow}>
      <View style={[s.logoIcon, { backgroundColor: PURPLE }]}>
       <Ionicons name="chatbubbles" size={16} color="#fff" />
      </View>
      <Text style={s.logoTxt}>Talksy</Text>
     </View>
    </View>

    <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
     <Text style={s.title}>Forgot Password?</Text>
     <Text style={s.sub}>Enter your registered phone number{"\n"}to reset your password.</Text>

     {/* Phone Input with India Flag */}
     <Text style={s.label}>Enter your phone number</Text>
     <View style={[s.phoneRow, error && s.phoneRowErr]}>
      <View style={s.flagBox}>
       <Text style={s.flagEmoji}>🇮🇳</Text>
       <Text style={s.countryCode}>+91</Text>
       <View style={s.flagDivider} />
      </View>
      <TextInput
       style={s.phoneInput}
       placeholder="Enter mobile number"
       placeholderTextColor="#aaa"
       keyboardType="number-pad"
       maxLength={10}
       value={mobile}
       onChangeText={(t) => { setMobile(t.replace(/\D/g, "").slice(0, 10)); setError(""); }}
      />
     </View>
     {error ? <Text style={s.err}>{error}</Text> : null}

     <Text style={s.securityTxt}>
      <Ionicons name="shield-checkmark" size={13} color="#aaa" />{" "}
      Securing your personal information is our priority
     </Text>
    </Animated.View>

    {/* Bottom Button */}
    <View style={s.bottomWrap}>
     <TouchableOpacity
      style={[s.btn, loading && { opacity: 0.7 }]}
      onPress={handleNext}
      disabled={loading}
      activeOpacity={0.8}
     >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Next</Text>}
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
  borderColor: "#e5e5e5", justifyContent: "center", alignItems: "center", marginBottom: 20,
 },
 logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
 logoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
 logoTxt: { fontSize: 20, fontWeight: "800", color: "#1a1a2e" },

 content: { flex: 1, paddingHorizontal: 24 },
 title: { fontSize: 24, fontWeight: "800", color: "#1a1a2e", marginBottom: 8 },
 sub: { fontSize: 14, color: "#888", lineHeight: 20, marginBottom: 32 },

 label: { fontSize: 13, color: "#888", marginBottom: 10 },
 phoneRow: {
  flexDirection: "row", alignItems: "center",
  borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 14,
  paddingHorizontal: 14, height: 54,
 },
 phoneRowErr: { borderColor: "#e74c3c" },
 flagBox: { flexDirection: "row", alignItems: "center", marginRight: 8 },
 flagEmoji: { fontSize: 22, marginRight: 6 },
 countryCode: { fontSize: 15, fontWeight: "600", color: "#1a1a2e", marginRight: 10 },
 flagDivider: { width: 1, height: 24, backgroundColor: "#e5e5e5" },
 phoneInput: { flex: 1, fontSize: 16, color: "#1a1a2e", paddingLeft: 10 },

 err: { color: "#e74c3c", fontSize: 12, marginTop: 6 },
 securityTxt: { fontSize: 12, color: "#aaa", marginTop: 16, lineHeight: 18 },

 bottomWrap: { paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 36 : 24 },
 btn: {
  backgroundColor: PURPLE, paddingVertical: 16, borderRadius: 14,
  alignItems: "center",
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
