import React, { useState } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SuccessPopup from "./SuccessPopup";

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
  <View style={s.container}>
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

     {/* Back */}
     {nav.canGoBack() && (
      <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
       <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
      </TouchableOpacity>
     )}

     {/* Header */}
     <Text style={s.title}>Create your account</Text>
     <Text style={s.sub}>Provide a unique username, mobile, and password{"\n"}to create your account and get started.</Text>

     {/* Username */}
     <Text style={s.label}>Username</Text>
     <TextInput
      style={[s.input, errors.username && s.errB]}
      placeholder="e.g. talksy_user"
      placeholderTextColor="#aaa"
      autoCapitalize="none"
      value={username}
      onChangeText={(t) => { setUsername(t.replace(/\s/g, '')); clearErr("username"); }}
     />
     {errors.username && <Text style={s.err}>{errors.username}</Text>}

     {/* Mobile */}
     <Text style={s.label}>Mobile Number</Text>
     <TextInput
      style={[s.input, errors.mobile && s.errB]}
      placeholder="Enter mobile number"
      placeholderTextColor="#aaa"
      keyboardType="number-pad"
      maxLength={10}
      value={mobile}
      onChangeText={(t) => { setMobile(t.replace(/\D/g, "").slice(0, 10)); clearErr("mobile"); }}
     />
     {errors.mobile && <Text style={s.err}>{errors.mobile}</Text>}

     {/* Password */}
     <Text style={s.label}>Password</Text>
     <View style={[s.passBox, errors.password && s.errB]}>
      <TextInput
       style={s.passInput}
       placeholder="Create password"
       placeholderTextColor="#aaa"
       secureTextEntry={!showPwd}
       autoCapitalize="none"
       autoCorrect={false}
       value={password}
       onChangeText={(t) => { setPassword(t); clearErr("password"); }}
      />
      <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
       <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
      </TouchableOpacity>
     </View>
     {errors.password && <Text style={s.err}>{errors.password}</Text>}

     {/* Terms */}
     <View style={s.termsRow}>
      <Switch
       value={agreed}
       onValueChange={(v) => { setAgreed(v); clearErr("terms"); }}
       trackColor={{ false: "#ddd", true: "#1a1a2e" }}
       thumbColor="#fff"
       style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
      <Text style={s.termsTxt}>
       I agree to the <Text style={s.termsLink}>Terms & Privacy Policy</Text>
      </Text>
     </View>
     {errors.terms && <Text style={s.err}>{errors.terms}</Text>}

     {/* API Error */}
     {errors.api && <Text style={[s.err, { textAlign: "center", marginTop: 8 }]}>{errors.api}</Text>}

     {/* Button */}
     <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign Up</Text>}
     </TouchableOpacity>

     {/* Link */}
     <Text style={s.linkRow}>
      Already have an account?{" "}
      <Text style={s.linkBold} onPress={() => nav.navigate("Login")}>Sign In</Text>
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
 container: { flex: 1, backgroundColor: "#fff" },
 scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 30 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  borderColor: "#e5e5e5", justifyContent: "center", alignItems: "center", marginBottom: 28,
 },
 title: { fontSize: 28, fontWeight: "800", color: "#1a1a2e", marginBottom: 8 },
 sub: { fontSize: 14, color: "#888", lineHeight: 20, marginBottom: 30 },
 label: { fontSize: 13, color: "#888", marginBottom: 8, marginTop: 18 },
 input: { borderBottomWidth: 1.2, borderBottomColor: "#e5e5e5", paddingVertical: 12, fontSize: 15, color: "#1a1a2e" },
 passBox: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.2, borderBottomColor: "#e5e5e5" },
 passInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1a1a2e" },
 errB: { borderBottomColor: "#e74c3c" },
 err: { color: "#e74c3c", fontSize: 12, marginTop: 4 },
 termsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20 },
 termsTxt: { fontSize: 13, color: "#555", flex: 1 },
 termsLink: { fontWeight: "700", color: "#1a1a2e" },
 btn: { backgroundColor: "#1a1a2e", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 32 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
 linkRow: { textAlign: "center", marginTop: 22, fontSize: 14, color: "#888" },
 linkBold: { fontWeight: "700", color: "#1a1a2e" },
});