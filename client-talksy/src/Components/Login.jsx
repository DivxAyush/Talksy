import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function Login({ setIsLoggedIn }) {

 const [mobile, setMobile] = useState("");
 const [password, setPassword] = useState("");
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);

 const navigation = useNavigation();

 const validate = () => {

  let newErrors = {};

  if (mobile.length !== 10) {
   newErrors.mobile = "Enter 10 digit mobile number";
  }

  if (!password) {
   newErrors.password = "Password required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const clearError = (field) => {
  setErrors((prev) => ({ ...prev, [field]: null }));
 };

 const handleLogin = async () => {

  if (!validate()) return;

  try {

   setLoading(true);

   const payload = {
    mobile,
    password
   };

   const res = await axios.post("https://talksy-3py1.onrender.com/api/users/login", payload );

  if (res.data.success) {

 await AsyncStorage.setItem(
  "userId",
  res.data.data._id
 );

 await AsyncStorage.setItem(
  "user",
  JSON.stringify(res.data.data)
 );

 setMobile("");
 setPassword("");

 setIsLoggedIn(true);

}

  }catch (err) {
  console.log("LOGIN ERROR:", err.response?.data);

 console.log("FULL ERROR:", err);
 console.log("ERROR MESSAGE:", err.message);
 console.log("ERROR RESPONSE:", err.response);

 alert("Login failed");
} finally {
   setLoading(false);
  }

 };

 return (

  <View style={styles.container}>

   <LinearGradient
    colors={["#5f7cff", "#4a60e0"]}
    style={styles.header}
   >
    <Text style={styles.headerTitle}>Welcome Back</Text>
    <Text style={styles.headerSub}>Login to continue</Text>
   </LinearGradient>

   <View style={styles.form}>

    {/* MOBILE */}

    <Text style={styles.label}>Mobile Number</Text>

    <TextInput
     style={[styles.input, errors.mobile && styles.errorBorder]}
     placeholder="Enter mobile number"
     keyboardType="number-pad"
     value={mobile}
     onChangeText={(text) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      if (cleaned.length <= 10) setMobile(cleaned);
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
      placeholder="Enter password"
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

    {/* BUTTON */}

    <TouchableOpacity
     onPress={handleLogin}
     disabled={loading}
    >

     <LinearGradient
      colors={["#5f7cff", "#4a60e0"]}
      style={styles.button}
     >

      {loading
       ? <ActivityIndicator color="#fff" />
       : <Text style={styles.buttonText}>Login</Text>
      }

     </LinearGradient>

    </TouchableOpacity>

    {/* REGISTER LINK */}

    <Text
     onPress={() => navigation.navigate("Register")}
     style={styles.LoginClick}
    >
     Don't have an Account ?
     <Text style={styles.LoginText}> Register</Text>
    </Text>

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