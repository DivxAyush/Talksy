import React, { useState, useRef, useContext } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
 StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";

const API = "https://talksy-3py1.onrender.com/api/users";
const COPPER = "#C4734A";

export default function ForgotPassword() {
 const [mobile, setMobile] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const nav = useNavigation();
 const { isDark } = useContext(ThemeContext);

 // Theme colors
 const bg = isDark ? "#121212" : "#F7ECE9";
 const surface = isDark ? "#1C1C1E" : "#FFFFFF";
 const textMain = isDark ? "#FFFFFF" : "#2B1F1A";
 const textSub = isDark ? "#A1A1A6" : "#8E5A55";
 const border = isDark ? "#2A2A2D" : "#F1D7D1";

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
  <View style={[s.container, { backgroundColor: bg }]}>
   <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

    {/* Header */}
    <View style={s.header}>
     <TouchableOpacity style={[s.backBtn, { borderColor: border }]} onPress={() => nav.goBack()}>
      <Ionicons name="arrow-back" size={22} color={textMain} />
     </TouchableOpacity>
     <View style={s.logoRow}>
      <View style={[s.logoIcon, { backgroundColor: COPPER }]}>
       <Ionicons name="chatbubbles" size={16} color="#fff" />
      </View>
      <Text style={[s.logoTxt, { color: textMain }]}>Klyro</Text>
     </View>
    </View>

    <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
     <Text style={[s.title, { color: textMain }]}>Forgot Password?</Text>
     <Text style={[s.sub, { color: textSub }]}>Enter your registered phone number{"\n"}to reset your password.</Text>

     {/* Phone Input with India Flag */}
     <Text style={[s.label, { color: textSub }]}>Enter your phone number</Text>
     <View style={[s.phoneRow, { backgroundColor: surface, borderColor: error ? "#e74c3c" : border }]}>
      <View style={s.flagBox}>
       <Text style={s.flagEmoji}>🇮🇳</Text>
       <Text style={[s.countryCode, { color: textMain }]}>+91</Text>
       <View style={[s.flagDivider, { backgroundColor: border }]} />
      </View>
      <TextInput
       style={[s.phoneInput, { color: textMain }]}
       placeholder="Enter mobile number"
       placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
       keyboardType="number-pad"
       maxLength={10}
       value={mobile}
       onChangeText={(t) => { setMobile(t.replace(/\D/g, "").slice(0, 10)); setError(""); }}
      />
     </View>
     {error ? <Text style={s.err}>{error}</Text> : null}

     <Text style={[s.securityTxt, { color: textSub }]}>
      <Ionicons name="shield-checkmark" size={13} color={textSub} />{" "}
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
 container: { flex: 1 },
 header: {
  paddingTop: Platform.OS === "ios" ? 56 : 48,
  paddingHorizontal: 20, paddingBottom: 10,
 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  justifyContent: "center", alignItems: "center", marginBottom: 20,
 },
 logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
 logoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
 logoTxt: { fontSize: 20, fontWeight: "800" },

 content: { flex: 1, paddingHorizontal: 24 },
 title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
 sub: { fontSize: 14, lineHeight: 20, marginBottom: 32 },

 label: { fontSize: 13, marginBottom: 10 },
 phoneRow: {
  flexDirection: "row", alignItems: "center",
  borderWidth: 1.5, borderRadius: 14,
  paddingHorizontal: 14, height: 54,
 },
 flagBox: { flexDirection: "row", alignItems: "center", marginRight: 8 },
 flagEmoji: { fontSize: 22, marginRight: 6 },
 countryCode: { fontSize: 15, fontWeight: "600", marginRight: 10 },
 flagDivider: { width: 1, height: 24 },
 phoneInput: { flex: 1, fontSize: 16, paddingLeft: 10 },

 err: { color: "#e74c3c", fontSize: 12, marginTop: 6 },
 securityTxt: { fontSize: 12, marginTop: 16, lineHeight: 18 },

 bottomWrap: { paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 36 : 24 },
 btn: {
  backgroundColor: COPPER, paddingVertical: 16, borderRadius: 14,
  alignItems: "center",
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
