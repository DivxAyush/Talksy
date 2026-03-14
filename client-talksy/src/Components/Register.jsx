import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function Register({ setIsLoggedIn }) {

 const [name, setName] = useState("");
 const [mobile, setMobile] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [errors, setErrors] = useState({});
 const [checked, setChecked] = useState(false);
 const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const navigation = useNavigation();
 // MOBILE VALIDATION
 const handleMobile = (text) => {
  const cleaned = text.replace(/[^0-9]/g, "");
  if (cleaned.length <= 10) {
   setMobile(cleaned);
  }
 };

 const validate = () => {

  let newErrors = {};

  if (!name.trim()) {
   newErrors.name = "Name required";
  }
  if (mobile.length !== 10) {
   newErrors.mobile = "Enter 10 digit mobile number";
  }
  if (password.length < 6) {
   newErrors.password = "Password must be at least 6 characters";
  }
  if (confirmPassword !== password) {
   newErrors.confirmPassword = "Passwords do not match";
  }
  if (!checked) {
   newErrors.privacy = "Accept privacy policy";
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };
 const clearError = (field) => {
  setErrors((prev) => ({ ...prev, [field]: null }));
 };

 const handleRegister = async () => {

  if (!validate()) return;

  try {
   setLoading(true);

   const payload = {
    username: name,
    mobile: mobile,
    password: password
   };

   const res = await axios.post("https://talksy-3py1.onrender.com/api/users/register", payload);

   if (res.data.success) {

    const user = res.data.user;

    await AsyncStorage.setItem("userId", user._id);

    await AsyncStorage.setItem(
     "user",
     JSON.stringify(user)
    );

    setName("");
    setMobile("");
    setPassword("");
    setConfirmPassword("");
    setChecked(false);
    setErrors({});

    setIsLoggedIn(true);

   }
  } catch (err) {
   alert(err?.response?.data?.message || "Server not reachable");

  } finally {
   setLoading(false);
  }
 };

 return (

  <View style={styles.container}>

   {/* HEADER */}
   <LinearGradient
    colors={["#5f7cff", "#4a60e0"]}
    style={styles.header}
   >
    <Text style={styles.headerTitle}>Create Account</Text>
    <Text style={styles.headerSub}>Sign up to continue</Text>
   </LinearGradient>

   <View style={styles.form}>

    {/* NAME */}
    <Text style={styles.label}>Name</Text>

    <TextInput
     style={[styles.input, errors.name && styles.errorBorder]}
     placeholder="Enter your name"
     value={name}
     onChangeText={(text) => {
      setName(text);
      clearError("name");
     }}
    />

    {errors.name && <Text style={styles.error}>{errors.name}</Text>}

    {/* MOBILE */}
    <Text style={styles.label}>Mobile Number</Text>

    <TextInput
     style={[styles.input, errors.mobile && styles.errorBorder]}
     placeholder="Enter mobile number"
     keyboardType="number-pad"
     value={mobile}
     onChangeText={(text) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      if (cleaned.length <= 10) {
       setMobile(cleaned);
      }
      clearError("mobile");
     }}
    />

    {errors.mobile && <Text style={styles.error}>{errors.mobile}</Text>}

    {/* PASSWORD */}
    <Text style={styles.label}>Password</Text>

    <View
     style={[
      styles.passwordBox,
      errors.password && styles.errorBorder
     ]}
    >

     <TextInput
      style={styles.passwordInput}
      placeholder="Create password"
      secureTextEntry={!showPassword}
      value={password}
      onChangeText={(text) => {
       setPassword(text);
       clearError("password");
      }}
     />

     <TouchableOpacity
      onPressIn={() => setShowPassword(true)}
      onPressOut={() => setShowPassword(false)}
     >
      <Ionicons name="eye-outline" size={20} color="gray" />
     </TouchableOpacity>

    </View>

    {errors.password && <Text style={styles.error}>{errors.password}</Text>}

    {/* CONFIRM PASSWORD */}

    <Text style={styles.label}>Confirm Password</Text>

    <View
     style={[
      styles.passwordBox,
      errors.confirmPassword && styles.errorBorder
     ]}
    >

     <TextInput
      style={styles.passwordInput}
      placeholder="Re-enter password"
      secureTextEntry={!showConfirm}
      value={confirmPassword}
      onChangeText={(text) => {
       setConfirmPassword(text);
       clearError("confirmPassword");
      }}
     />

     <TouchableOpacity
      onPressIn={() => setShowConfirm(true)}
      onPressOut={() => setShowConfirm(false)}
     >
      <Ionicons name="eye-outline" size={20} color="gray" />
     </TouchableOpacity>

    </View>

    {errors.confirmPassword &&
     <Text style={styles.error}>{errors.confirmPassword}</Text>
    }

    {/* PRIVACY */}

    <TouchableOpacity
     style={styles.checkboxRow}
     onPress={() => setChecked(!checked)}
    >
     <Ionicons
      name={checked ? "checkbox" : "square-outline"}
      size={20}
      color="#4a60e0"
     />

     <Text style={styles.checkboxText}>
      I agree with privacy policy
     </Text>
    </TouchableOpacity>

    {errors.privacy && <Text style={styles.error}>{errors.privacy}</Text>}

    {/* BUTTON */}

    <TouchableOpacity
     onPress={handleRegister}
     disabled={loading}
    >
     <LinearGradient
      colors={["#5f7cff", "#4a60e0"]}
      style={styles.button}
     >

      {loading
       ? <ActivityIndicator color="#fff" />
       : <Text style={styles.buttonText}>Sign Up</Text>
      }

     </LinearGradient>
    </TouchableOpacity>

    <Text style={styles.or}>or sign up with</Text>

    <View style={styles.socialRow}>

     <TouchableOpacity style={styles.socialBtn}>
      <FontAwesome name="google" size={20} color="#DB4437" />
     </TouchableOpacity>

     <TouchableOpacity style={styles.socialBtn}>
      <FontAwesome name="apple" size={20} color="black" />
     </TouchableOpacity>

     <TouchableOpacity style={styles.socialBtn}>
      <FontAwesome name="facebook" size={20} color="#1877F2" />
     </TouchableOpacity>

    </View>
    <Text onPress={() => navigation.navigate("Login")} style={styles.LoginClick}>Already have an Account ? <Text style={styles.LoginText}>Login</Text></Text>


   </View>

  </View>
 );
}

const styles = StyleSheet.create({

 LoginClick: {
  fontSize: 15,
  textAlign: "center",
  marginTop: 15,
  color: "#888"
 },
 LoginText: {
  fontWeight: 700,
  color: "#5f7cff"
 },


 container: {
  flex: 1,
  backgroundColor: "#fff"
 },

 header: {
  height: 230,
  justifyContent: "center",
  paddingHorizontal: 25
 },

 headerTitle: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "bold"
 },

 headerSub: {
  color: "#fff",
  marginTop: 5
 },

 form: {
  padding: 20,
  marginTop: -40,
  backgroundColor: "#fff",
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30
 },

 label: {
  fontSize: 14,
  marginTop: 10,
  marginBottom: 5
 },

 input: {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12
 },

 passwordBox: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  paddingHorizontal: 10
 },

 passwordInput: {
  flex: 1,
  padding: 12
 },

 checkboxRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 15
 },

 checkboxText: {
  marginLeft: 8
 },

 button: {
  marginTop: 20,
  padding: 15,
  borderRadius: 10,
  alignItems: "center"
 },

 buttonText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16
 },

 or: {
  textAlign: "center",
  marginTop: 15,
  color: "#888"
 },

 socialRow: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: 15
 },

 socialBtn: {
  backgroundColor: "#f1f1f1",
  padding: 12,
  borderRadius: 10,
  width: 60,
  alignItems: "center"
 },

 error: {
  color: "red",
  fontSize: 12,
  marginTop: 4
 },

 errorBorder: {
  borderColor: "red"
 }

});