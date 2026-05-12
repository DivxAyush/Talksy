import React, { useState, useContext } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SuccessPopup from "./SuccessPopup";
import { ThemeContext } from "../context/ThemeContext";

const API = "https://talksy-3py1.onrender.com/api/users";

export default function Login({ setIsLoggedIn }) {
 const [mobile, setMobile] = useState("");
 const [password, setPassword] = useState("");
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [showPwd, setShowPwd] = useState(false);
 const [acceptTerms, setAcceptTerms] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);
 const nav = useNavigation();
 const { isDark } = useContext(ThemeContext);

 // Theme colors
 const bg = isDark ? "#121212" : "#F7ECE9";
 const surface = isDark ? "#1C1C1E" : "#FFFFFF";
 const textMain = isDark ? "#FFFFFF" : "#2B1F1A";
 const textSub = isDark ? "#A1A1A6" : "#8E5A55";
 const border = isDark ? "#2A2A2D" : "#F1D7D1";
 const copper = "#C4734A";
 const copperLight = "rgba(196, 115, 74, 0.12)";

 const validate = () => {
  const e = {};
  if (!/^\d{10}$/.test(mobile)) e.mobile = "Enter valid 10-digit mobile number";
  if (!password.trim()) e.password = "Password is required";
  else if (password.length < 6) e.password = "Minimum 6 characters";
  setErrors(e);
  return !Object.keys(e).length;
 };

 const clearErr = (f) => setErrors((p) => ({ ...p, [f]: null }));

 const handleLogin = async () => {
  if (!validate()) return;
  try {
   setLoading(true);
   setErrors({});
   const { data } = await axios.post(`${API}/login`, { mobile, password });
   if (data.success) {
    await AsyncStorage.multiSet([
     ["userId", data.user._id],
     ["user", JSON.stringify(data.user)],
     ["socketToken", data.socketToken || ""],
    ]);
    setMobile("");
    setPassword("");
    setShowSuccess(true);
   }
  } catch (err) {
   setErrors({ api: err?.response?.data?.message || "Login failed. Please try again." });
  } finally {
   setLoading(false);
  }
 };

 return (
  <View style={[s.container, { backgroundColor: bg }]}>
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

     {/* Logo */}
     <View style={s.logoWrap}>
      <Image source={require("../../assets/KlyroLightLogo.png")} style={s.logoImg} resizeMode="contain" />
     </View>

     {/* Header */}
     <Text style={[s.title, { color: textMain }]}>Sign In to Klyro</Text>
     <Text style={[s.sub, { color: textSub }]}>First time here? <Text style={[s.linkBold, { color: copper }]} onPress={() => nav.navigate("Register")}>Sign Up</Text></Text>

     {/* Email/Mobile */}
     <Text style={[s.label, { color: textSub }]}>Mobile Number *</Text>
     <View style={[s.inputWrap, { backgroundColor: surface, borderColor: errors.mobile ? "#e74c3c" : border }]}>
      <Ionicons name="call-outline" size={18} color={textSub} style={s.inputIcon} />
      <TextInput
       style={[s.input, { color: textMain }]}
       placeholder="Enter mobile number"
       placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
       keyboardType="number-pad"
       maxLength={10}
       value={mobile}
       onChangeText={(t) => { setMobile(t.replace(/\D/g, "").slice(0, 10)); clearErr("mobile"); }}
      />
     </View>
     {errors.mobile && <Text style={s.err}>{errors.mobile}</Text>}

     {/* Password */}
     <Text style={[s.label, { color: textSub }]}>Password *</Text>
     <View style={[s.inputWrap, { backgroundColor: surface, borderColor: errors.password ? "#e74c3c" : border }]}>
      <Ionicons name="lock-closed-outline" size={18} color={textSub} style={s.inputIcon} />
      <TextInput
       style={[s.input, { color: textMain }]}
       placeholder="Enter password"
       placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
       secureTextEntry={!showPwd}
       autoCapitalize="none"
       autoCorrect={false}
       value={password}
       onChangeText={(t) => { setPassword(t); clearErr("password"); }}
      />
      <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
       <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={20} color={textSub} />
      </TouchableOpacity>
     </View>
     {errors.password && <Text style={s.err}>{errors.password}</Text>}

     {/* Terms checkbox */}
     <TouchableOpacity style={s.termsRow} onPress={() => setAcceptTerms(!acceptTerms)} activeOpacity={0.7}>
      <View style={[s.checkbox, { borderColor: copper, backgroundColor: acceptTerms ? copper : "transparent" }]}>
       {acceptTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={[s.termsTxt, { color: textSub }]}>Accept sign in with Touch/Face ID</Text>
     </TouchableOpacity>

     {/* API Error */}
     {errors.api && <Text style={[s.err, { textAlign: "center", marginTop: 8 }]}>{errors.api}</Text>}

     {/* Button */}
     <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign In</Text>}
     </TouchableOpacity>

     {/* Forgot Password */}
     <TouchableOpacity onPress={() => nav.navigate("ForgotPassword")} style={s.forgotWrap}>
      <Text style={[s.forgotTxt, { color: textSub }]}>Forgot Password?</Text>
     </TouchableOpacity>

     {/* Divider */}
     <View style={s.dividerRow}>
      <View style={[s.dividerLine, { backgroundColor: border }]} />
      <Text style={[s.dividerText, { color: textSub }]}>or sign in with</Text>
      <View style={[s.dividerLine, { backgroundColor: border }]} />
     </View>

     {/* Social Buttons */}
     <View style={s.socialRow}>
      <TouchableOpacity style={[s.socialBtn, { backgroundColor: surface, borderColor: border }]}>
       <Text style={s.socialIcon}>G</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.socialBtn, { backgroundColor: surface, borderColor: border }]}>
       <Ionicons name="logo-facebook" size={22} color="#1877F2" />
      </TouchableOpacity>
      <TouchableOpacity style={[s.socialBtn, { backgroundColor: surface, borderColor: border }]}>
       <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
      </TouchableOpacity>
      <TouchableOpacity style={[s.socialBtn, { backgroundColor: surface, borderColor: border }]}>
       <Ionicons name="logo-apple" size={22} color={textMain} />
      </TouchableOpacity>
     </View>

    </ScrollView>
   </KeyboardAvoidingView>

   <SuccessPopup
    visible={showSuccess}
    title="Welcome Back! 🎉"
    message="You have logged in successfully."
    slogan="Let's start chatting! 💬"
    onAutoClose={() => { setShowSuccess(false); setIsLoggedIn(true); }}
   />
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1 },
 scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30 },
 logoWrap: { alignItems: "center", marginBottom: 32 },
 logoImg: { width: 70, height: 70 },
 title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
 sub: { fontSize: 14, textAlign: "center", marginBottom: 32 },
 label: { fontSize: 13, fontWeight: "500", marginBottom: 8, marginTop: 16 },
 inputWrap: {
  flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1,
  paddingHorizontal: 14, height: 52,
 },
 inputIcon: { marginRight: 10 },
 input: { flex: 1, fontSize: 15, height: "100%" },
 err: { color: "#e74c3c", fontSize: 12, marginTop: 4 },
 termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
 checkbox: {
  width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
  justifyContent: "center", alignItems: "center",
 },
 termsTxt: { fontSize: 13 },
 btn: {
  backgroundColor: "#C4734A", paddingVertical: 16, borderRadius: 14,
  alignItems: "center", marginTop: 28,
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
 forgotWrap: { alignItems: "center", marginTop: 16 },
 forgotTxt: { fontSize: 13, fontWeight: "500" },
 dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 28, marginBottom: 20 },
 dividerLine: { flex: 1, height: 1 },
 dividerText: { marginHorizontal: 12, fontSize: 13 },
 socialRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
 socialBtn: {
  width: 50, height: 50, borderRadius: 14, borderWidth: 1,
  justifyContent: "center", alignItems: "center",
 },
 socialIcon: { fontSize: 20, fontWeight: "700", color: "#EA4335" },
 linkBold: { fontWeight: "700" },
});