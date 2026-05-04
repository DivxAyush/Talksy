import React, { useState, useRef, useContext, useEffect } from "react";
import {
 View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions,
 Modal, Pressable, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Settings({ navigation }) {
 const { isDark, toggleTheme } = useContext(ThemeContext);
 const [user, setUser] = useState(null);
 
 const [modalVisible, setModalVisible] = useState(false);
 const sheetAnim = useRef(new Animated.Value(0)).current;
 const curtainAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
 const [curtainColor, setCurtainColor] = useState("#1a1a2e");

 useEffect(() => {
  const loadUser = async () => {
   const userStr = await AsyncStorage.getItem("user");
   if (userStr) setUser(JSON.parse(userStr));
  };
  const unsubscribe = navigation.addListener('focus', loadUser);
  return unsubscribe;
 }, [navigation]);

 // Dynamic Colors
 const bg = isDark ? "#111b21" : "#fafafa";
 const surface = isDark ? "#202c33" : "#fff";
 const textMain = isDark ? "#e9edef" : "#111b21";
 const textSub = isDark ? "#8696a0" : "#667781";
 const iconColor = isDark ? "#8696a0" : "#54656f";

 const openModal = () => {
  setModalVisible(true);
  Animated.timing(sheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
 };

 const closeModal = () => {
  Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
   setModalVisible(false);
  });
 };

 const handleThemeChange = (mode) => {
  closeModal();
  if ((mode === "dark" && isDark) || (mode === "light" && !isDark)) return;

  setCurtainColor(mode === "dark" ? "#111b21" : "#fafafa");

  // Animate curtain from top to bottom
  curtainAnim.setValue(-SCREEN_HEIGHT);
  Animated.timing(curtainAnim, {
   toValue: 0,
   duration: 350,
   useNativeDriver: true
  }).start(() => {
   // Flip theme when screen is covered
   toggleTheme(mode);
   
   // Continue animation downwards off the screen
   Animated.timing(curtainAnim, {
    toValue: SCREEN_HEIGHT,
    duration: 350,
    useNativeDriver: true
   }).start();
  });
 };

 const SettingItem = ({ icon, title, sub, onPress }) => (
  <TouchableOpacity style={s.itemRow} onPress={onPress} activeOpacity={0.7}>
   <View style={s.iconWrap}>
    <Ionicons name={icon} size={24} color={iconColor} />
   </View>
   <View style={s.itemTextWrap}>
    <Text style={[s.itemTitle, { color: textMain }]}>{title}</Text>
    <Text style={[s.itemSub, { color: textSub }]}>{sub}</Text>
   </View>
  </TouchableOpacity>
 );

 return (
  <View style={[s.container, { backgroundColor: bg }]}>
   <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bg} />

   {/* Header */}
   <View style={[s.header, { backgroundColor: bg }]}>
    <View style={s.headerLeft}>
     <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
      <Ionicons name="arrow-back" size={24} color={textMain} />
     </TouchableOpacity>
     <Text style={[s.headerTitle, { color: textMain }]}>Settings</Text>
    </View>
    <TouchableOpacity style={{ padding: 4 }}>
     <Ionicons name="search" size={24} color={textMain} />
    </TouchableOpacity>
   </View>

   <ScrollView showsVerticalScrollIndicator={false}>
    {/* Profile Section */}
    <TouchableOpacity 
     style={[s.profileSection, { borderBottomColor: isDark ? "#202c33" : "#f0f0f0" }]}
     onPress={() => navigation.navigate("Profile")}
     activeOpacity={0.7}
    >
     <View style={[s.avatar, { backgroundColor: isDark ? "#00a884" : "#1a1a2e" }]}>
      {user?.profilePic ? (
       <Image source={{ uri: user.profilePic }} style={{ width: "100%", height: "100%", borderRadius: 30 }} />
      ) : (
       <Text style={s.avatarTxt}>{user?.username?.charAt(0)?.toUpperCase() || "T"}</Text>
      )}
     </View>
     <View style={s.profileInfo}>
      <Text style={[s.profileName, { color: textMain }]}>{user?.name || user?.username || "Talksy User"}</Text>
      <Text style={[s.profileStatus, { color: textSub }]} numberOfLines={1}>
       {user?.about || "Hey there! I am using Talksy."}
      </Text>
     </View>
    </TouchableOpacity>

    {/* Settings List */}
    <View style={s.settingsList}>
     <SettingItem icon="key-outline" title="Account" sub="Security notifications, change number" />
     <SettingItem icon="lock-closed-outline" title="Privacy" sub="Blocked accounts, disappearing messages" />
     
     {/* Appearance Item */}
     <SettingItem 
      icon={isDark ? "moon" : "moon-outline"} 
      title="Appearance" 
      sub="Dark mode, light mode, app theme" 
      onPress={openModal} 
     />
     
     <SettingItem icon="chatbox-ellipses-outline" title="Chats" sub="Theme, wallpapers, chat history" />
     <SettingItem icon="notifications-outline" title="Notifications" sub="Message, group & call tones" />
     <SettingItem icon="pie-chart-outline" title="Storage and data" sub="Network usage, auto-download" />
     <SettingItem icon="help-circle-outline" title="Help and feedback" sub="Help centre, contact us, privacy policy" />
    </View>
   </ScrollView>

   {/* Appearance Bottom Sheet Modal */}
   <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
    <View style={s.modalOverlay}>
     <Animated.View style={[s.modalBackdrop, { opacity: sheetAnim }]} />
     <Pressable style={{ flex: 1 }} onPress={closeModal} />
     
     <Animated.View style={[s.bottomSheet, {
      backgroundColor: surface,
      transform: [{
       translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] })
      }]
     }]}>
      <View style={s.sheetHandle} />
      <Text style={[s.sheetTitle, { color: textMain }]}>Choose theme</Text>
      
      <TouchableOpacity style={s.radioRow} onPress={() => handleThemeChange("light")} activeOpacity={0.7}>
       <View style={[s.radioOuter, !isDark && s.radioOuterActive, !isDark && { borderColor: "#00a884" }]}>
        {!isDark && <View style={[s.radioInner, { backgroundColor: "#00a884" }]} />}
       </View>
       <Text style={[s.radioText, { color: textMain }]}>Light Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.radioRow} onPress={() => handleThemeChange("dark")} activeOpacity={0.7}>
       <View style={[s.radioOuter, isDark && s.radioOuterActive, isDark && { borderColor: "#00a884" }]}>
        {isDark && <View style={[s.radioInner, { backgroundColor: "#00a884" }]} />}
       </View>
       <Text style={[s.radioText, { color: textMain }]}>Dark Mode</Text>
      </TouchableOpacity>

     </Animated.View>
    </View>
   </Modal>

   {/* Dropping Curtain Animation View */}
   <Animated.View
    pointerEvents="none"
    style={[
     StyleSheet.absoluteFill,
     {
      backgroundColor: curtainColor,
      zIndex: 9999,
      transform: [{ translateY: curtainAnim }]
     }
    ]}
   />

  </View>
 );
}

const s = StyleSheet.create({
 container: { flex: 1 },
 header: {
  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
 },
 headerLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
 headerTitle: { fontSize: 20, fontWeight: "500" },

 profileSection: {
  flexDirection: "row", alignItems: "center", padding: 20,
  borderBottomWidth: 1,
 },
 avatar: {
  width: 60, height: 60, borderRadius: 30, backgroundColor: "#1a1a2e",
  justifyContent: "center", alignItems: "center"
 },
 avatarTxt: { color: "#fff", fontSize: 24, fontWeight: "600" },
 profileInfo: { flex: 1, marginLeft: 16 },
 profileName: { fontSize: 18, fontWeight: "500", marginBottom: 4 },
 profileStatus: { fontSize: 14 },

 settingsList: { paddingVertical: 10 },
 itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 20 },
 iconWrap: { width: 30, alignItems: "flex-start", marginRight: 16 },
 itemTextWrap: { flex: 1 },
 itemTitle: { fontSize: 16, marginBottom: 2 },
 itemSub: { fontSize: 13 },

 // Modal Styles
 modalOverlay: { flex: 1, justifyContent: "flex-end" },
 modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
 bottomSheet: {
  borderTopLeftRadius: 20, borderTopRightRadius: 20,
  paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
 },
 sheetHandle: {
  width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc",
  alignSelf: "center", marginBottom: 20,
 },
 sheetTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
 radioRow: {
  flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 16,
 },
 radioOuter: {
  width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#777",
  justifyContent: "center", alignItems: "center",
 },
 radioOuterActive: { borderColor: "#00a884" },
 radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00a884" },
 radioText: { fontSize: 16, fontWeight: "500" },
});
