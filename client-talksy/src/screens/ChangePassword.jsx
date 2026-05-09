import React, { useState, useRef, useEffect } from "react";
import {
 View, Text, TextInput, TouchableOpacity, StyleSheet,
 ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
 StatusBar, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SuccessPopup from "../Components/SuccessPopup";

const API = "https://talksy-3py1.onrender.com/api/users";
const PURPLE = "#5B5FC7";

export default function ChangePassword() {
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showNew, setShowNew] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);

 const nav = useNavigation();
 const route = useRoute();
 const { mobile, flow } = route.params; // flow: "forgot" or "settings"

 // Animations
 const fadeAnim = useRef(new Animated.Value(0)).current;
 const slideAnim = useRef(new Animated.Value(30)).current;
 const lockAnim = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  Animated.parallel([
   Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
   Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
   Animated.spring(lockAnim, { toValue: 1, tension: 60, friction: 6, delay: 200, useNativeDriver: true }),
  ]).start();
 }, []);

 const clearErr = (f) => setErrors((p) => ({ ...p, [f]: null }));

 const handleChange = async () => {
  const e = {};
  if (!newPassword.trim()) e.newPassword = "Password is required";
  else if (newPassword.length < 6) e.newPassword = "Minimum 6 characters";
  if (!confirmPassword.trim()) e.confirmPassword = "Please confirm password";
  else if (newPassword !== confirmPassword) e.confirmPassword = "Passwords don't match";
  setErrors(e);
  if (Object.keys(e).length) return;

  try {
   setLoading(true);
   setErrors({});

   if (flow === "settings") {
    // Logged in user changing password
    const userId = await AsyncStorage.getItem("userId");
    await axios.put(`${API}/change-password/${userId}`, { newPassword });
   } else {
    // Forgot password flow
    await axios.post(`${API}/change-password`, { mobile, newPassword });
   }

   setShowSuccess(true);
  } catch (err) {
   setErrors({ api: err?.response?.data?.message || "Failed to change password" });
  } finally {
   setLoading(false);
  }
 };

 const handleSuccessClose = () => {
  setShowSuccess(false);
  if (flow === "forgot") {
   // Go back to login
   nav.dispatch(
    CommonActions.reset({
     index: 0,
     routes: [{ name: "Login" }],
    })
   );
  } else {
   // Go back to settings
   nav.goBack();
   nav.goBack(); // Go past OTP screen too
  }
 };

 // Password strength indicator
 const getStrength = () => {
  if (!newPassword) return { label: "", color: "#ddd", width: 0 };
  if (newPassword.length < 6) return { label: "Weak", color: "#e74c3c", width: 30 };
  if (newPassword.length < 8) return { label: "Fair", color: "#f39c12", width: 50 };
  if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) return { label: "Strong", color: "#2ecc71", width: 100 };
  return { label: "Good", color: "#3498db", width: 75 };
 };

 const strength = getStrength();

 return (
  <View style={s.container}>
   <StatusBar barStyle="dark-content" backgroundColor="#fff" />
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

     {/* Header */}
     <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
       <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
      </TouchableOpacity>
     </View>

     {/* Lock Icon */}
     <Animated.View style={[s.lockWrap, { transform: [{ scale: lockAnim }] }]}>
      <View style={s.lockCircle}>
       <Ionicons name="lock-closed" size={32} color="#fff" />
      </View>
     </Animated.View>

     <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Text style={s.title}>Create New Password</Text>
      <Text style={s.sub}>
       Your new password must be different from{"\n"}previously used passwords.
      </Text>

      {/* New Password */}
      <Text style={s.label}>New Password</Text>
      <View style={[s.passBox, errors.newPassword && s.errBorder]}>
       <Ionicons name="lock-closed-outline" size={18} color="#bbb" style={{ marginRight: 10 }} />
       <TextInput
        style={s.passInput}
        placeholder="Enter new password"
        placeholderTextColor="#aaa"
        secureTextEntry={!showNew}
        autoCapitalize="none"
        autoCorrect={false}
        value={newPassword}
        onChangeText={(t) => { setNewPassword(t); clearErr("newPassword"); }}
       />
       <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
       </TouchableOpacity>
      </View>
      {errors.newPassword && <Text style={s.err}>{errors.newPassword}</Text>}

      {/* Strength Bar */}
      {newPassword.length > 0 && (
       <View style={s.strengthWrap}>
        <View style={s.strengthBarBg}>
         <Animated.View style={[s.strengthBar, { width: `${strength.width}%`, backgroundColor: strength.color }]} />
        </View>
        <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
       </View>
      )}

      {/* Confirm Password */}
      <Text style={[s.label, { marginTop: 24 }]}>Confirm New Password</Text>
      <View style={[s.passBox, errors.confirmPassword && s.errBorder]}>
       <Ionicons name="lock-closed-outline" size={18} color="#bbb" style={{ marginRight: 10 }} />
       <TextInput
        style={s.passInput}
        placeholder="Confirm new password"
        placeholderTextColor="#aaa"
        secureTextEntry={!showConfirm}
        autoCapitalize="none"
        autoCorrect={false}
        value={confirmPassword}
        onChangeText={(t) => { setConfirmPassword(t); clearErr("confirmPassword"); }}
       />
       <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
       </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={s.err}>{errors.confirmPassword}</Text>}

      {/* Match indicator */}
      {confirmPassword.length > 0 && newPassword === confirmPassword && (
       <View style={s.matchRow}>
        <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
        <Text style={s.matchTxt}>Passwords match</Text>
       </View>
      )}

      {/* API Error */}
      {errors.api && <Text style={[s.err, { textAlign: "center", marginTop: 12 }]}>{errors.api}</Text>}

      {/* Button */}
      <TouchableOpacity
       style={[s.btn, loading && { opacity: 0.7 }]}
       onPress={handleChange}
       disabled={loading}
       activeOpacity={0.8}
      >
       {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Change Password</Text>}
      </TouchableOpacity>
     </Animated.View>

    </ScrollView>
   </KeyboardAvoidingView>

   <SuccessPopup
    visible={showSuccess}
    title="Password Changed! 🔒"
    message="Your password has been changed successfully."
    slogan="Your account is now secure! ✨"
    onAutoClose={handleSuccessClose}
   />
  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1, backgroundColor: "#fff" },
 scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
 header: {
  paddingTop: Platform.OS === "ios" ? 56 : 48,
  paddingBottom: 10,
 },
 backBtn: {
  width: 42, height: 42, borderRadius: 12, borderWidth: 1.2,
  borderColor: "#e5e5e5", justifyContent: "center", alignItems: "center",
 },

 lockWrap: { alignItems: "center", marginVertical: 20 },
 lockCircle: {
  width: 72, height: 72, borderRadius: 36,
  backgroundColor: PURPLE, justifyContent: "center", alignItems: "center",
  shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
 },

 title: { fontSize: 24, fontWeight: "800", color: "#1a1a2e", marginBottom: 8, textAlign: "center" },
 sub: { fontSize: 14, color: "#888", lineHeight: 20, marginBottom: 32, textAlign: "center" },

 label: { fontSize: 13, color: "#888", marginBottom: 10 },
 passBox: {
  flexDirection: "row", alignItems: "center",
  borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 14,
  paddingHorizontal: 14, height: 54,
 },
 errBorder: { borderColor: "#e74c3c" },
 passInput: { flex: 1, fontSize: 15, color: "#1a1a2e" },
 err: { color: "#e74c3c", fontSize: 12, marginTop: 6 },

 // Strength
 strengthWrap: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
 strengthBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#f0f0f0" },
 strengthBar: { height: 4, borderRadius: 2 },
 strengthLabel: { fontSize: 12, fontWeight: "600" },

 // Match
 matchRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
 matchTxt: { fontSize: 12, color: "#2ecc71", fontWeight: "600" },

 btn: {
  backgroundColor: PURPLE, paddingVertical: 16, borderRadius: 14,
  alignItems: "center", marginTop: 36,
 },
 btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
