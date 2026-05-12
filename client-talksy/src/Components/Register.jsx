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

export default function Register({ setIsLoggedIn }) {
 const [username, setUsername] = useState("");
 const [mobile, setMobile] = useState("");
 const [password, setPassword] = useState("");
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [showPwd, setShowPwd] = useState(false);
 const [agreed, setAgreed] = useState(false);
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

 const validate = () => {
  const e = {};
  if (!username.trim()) e.username = "Username is required";
  else if (username.trim().length < 3) e.username = "Username must be at least 3 characters";
  else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = "Only letters, numbers, and _ allowed (no spaces)";
  if (!/^\d{10}$/.test(mobile)) e.mobile = "Enter valid 10-digit mobile number";
  if (!password.trim()) e.password = "Password is required";
  else if (password.length < 6) e.password = "Minimum 6 characters";
  if (!agreed) e.terms = "Please accept Terms & Privacy Policy";
  setErrors(e);
  return !Object.keys(e).length;
 };

 const clearErr = (f) => setErrors((p) => ({ ...p, [f]: null }));

 const handleRegister = async () => {
  if (!validate()) return;
  try {
   setLoading(true);
   setErrors({});
   const { data } = await axios.post(`${API}/register`, {
    username: username.trim(),
    mobile,
    password,
   });
   if (data.success) {
    await AsyncStorage.multiSet([
     ["userId", data.user._id],
     ["user", JSON.stringify(data.user)],
     ["socketToken", data.socketToken || ""],
    ]);
    setUsername("");
    setMobile("");
    setPassword("");
    setAgreed(false);
    setShowSuccess(true);
   }
  } catch (err) {
   setErrors({ api: err?.response?.data?.message || "Registration failed. Please try again." });
  } finally {
   setLoading(false);
  }
 };

 return (
  <View style={[s.container, { backgroundColor: bg }]}>
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

     {/* Back */}
     {nav.canGoBack() && (
      <TouchableOpacity style={[s.backBtn, { borderColor: border }]} onPress={() => nav.goBack()}>
       <Ionicons name="arrow-back" size={22} color={textMain} />
      </TouchableOpacity>
     )}

     {/* Header */}
     <Text style={[s.title, { color: textMain }]}>Create your account</Text>
     <Text style={[s.sub, { color: textSub }]}>Provide a unique username, mobile, and password{"\n"}to create your account and get started.</Text>

     {/* Username */}
     <Text style={[s.label, { color: textSub }]}>Username</Text>
     <View style={[s.inputWrap, { backgroundColor: surface, borderColor: errors.username ? "#e74c3c" : border }]}>
      <Ionicons name="person-outline" size={18} color={textSub} style={s.inputIcon} />
      <TextInput
       style={[s.input, { color: textMain }]}
       placeholder="e.g. klyro_user"
       placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
       autoCapitalize="none"
       value={username}
       onChangeText={(t) => { setUsername(t.replace(/\s/g, '')); clearErr("username"); }}
      />
     </View>
     {errors.username && <Text style={s.err}>{errors.username}</Text>}

     {/* Mobile */}
     <Text style={[s.label, { color: textSub }]}>Mobile Number</Text>
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
     <Text style={[s.label, { color: textSub }]}>Password</Text>
     <View style={[s.inputWrap, { backgroundColor: surface, borderColor: errors.password ? "#e74c3c" : border }]}>
      <Ionicons name="lock-closed-outline" size={18} color={textSub} style={s.inputIcon} />
      <TextInput
       style={[s.input, { color: textMain }]}
       placeholder="Create password"
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

     {/* Terms */}
     <TouchableOpacity style={s.termsRow} onPress={() => { setAgreed(!agreed); clearErr("terms"); }} activeOpacity={0.7}>
      <View style={[s.checkbox, { borderColor: copper, backgroundColor: agreed ? copper : "transparent" }]}>
       {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={[s.termsTxt, { color: textSub }]}>
       I agree to the <Text style={[s.termsLink, { color: copper }]}>Terms & Privacy Policy</Text>
      </Text>
     </TouchableOpacity>
     {errors.terms && <Text style={s.err}>{errors.terms}</Text>}

     {/* API Error */}
     {errors.api && <Text style={[s.err, { textAlign: "center", marginTop: 8 }]}>{errors.api}</Text>}

     {/* Button */}
     <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign Up</Text>}
     </TouchableOpacity>

     {/* Link */}
     <Text style={[s.linkRow, { color: textSub }]}>
      Already have an account?{" "}
      <Text style={[s.linkBold, { color: copper }]} onPress={() => nav.navigate("Login")}>Sign In</Text>
     </Text>

    </ScrollView>
   </KeyboardAvoidingView>

   <SuccessPopup
    visible={showSuccess}
    title="Account Created! 🎉"
    message="Your account is created successfully and ready now."
    slogan="Time to connect & chat! 🚀"
    onAutoClose={() => { setShowSuccess(false); setIsLoggedIn(true); }}
   />
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1 },
 scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 30 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  justifyContent: "center", alignItems: "center", marginBottom: 28,
 },
 title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
 sub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
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
 termsTxt: { fontSize: 13, flex: 1 },
 termsLink: { fontWeight: "700" },
 btn: { backgroundColor: "#C4734A", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 28 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
 linkRow: { textAlign: "center", marginTop: 22, fontSize: 14 },
 linkBold: { fontWeight: "700" },
});