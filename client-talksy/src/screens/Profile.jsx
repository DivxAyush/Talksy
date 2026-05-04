import React, { useState, useEffect, useContext } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard,
    Pressable, Modal, Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../context/ThemeContext";

const API = "https://talksy-3py1.onrender.com/api/users";

export default function Profile({ navigation }) {
    const { isDark } = useContext(ThemeContext);

    const [user, setUser] = useState(null);
    const [name, setName] = useState("");
    const [about, setAbout] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showPickerMenu, setShowPickerMenu] = useState(false);
    const menuAnim = React.useRef(new Animated.Value(0)).current;

    // Dynamic Theme Colors
    const bg = isDark ? "#0b141a" : "#fafafa";
    const headerBg = isDark ? "#202c33" : "#fff";
    const surface = isDark ? "#202c33" : "#fff";
    const textMain = isDark ? "#e9edef" : "#1a1a2e";
    const textSub = isDark ? "#8696a0" : "#666";
    const border = isDark ? "#202c33" : "#f0f0f0";

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const parsedUser = JSON.parse(userStr);
                    setUser(parsedUser);
                    setName(parsedUser.name || "");
                    setAbout(parsedUser.about || "Hey there! I am using Talksy.");
                    setProfilePic(parsedUser.profilePic || "");
                }
            } catch (error) {
                console.log("Error loading user", error);
            }
        };
        loadUser();
    }, []);

    const openPickerMenu = () => {
        Keyboard.dismiss();
        setShowPickerMenu(true);
        Animated.spring(menuAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const closePickerMenu = () => {
        Animated.timing(menuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setShowPickerMenu(false);
        });
    };

    const pickImage = async (type) => {
        closePickerMenu();
        let result;
        if (type === "camera") {
            await ImagePicker.requestCameraPermissionsAsync();
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
            });
        }

        if (!result.canceled && result.assets[0].base64) {
            setProfilePic(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const saveProfile = async () => {
        if (!user?._id) return;
        setSaving(true);
        try {
            const { data } = await axios.put(`${API}/profile/${user._id}`, {
                name: name.trim(),
                about: about.trim(),
                profilePic
            });

            if (data.success) {
                await AsyncStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                Alert.alert("Success", "Profile updated successfully!");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            {/* Minimal Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={textMain} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: textMain }]}>Profile</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={s.scrollViewWrapper}>
                    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
                        {/* Avatar Section */}
                        <View style={s.avatarWrap}>
                            <View style={s.avatarShadow}>
                                <TouchableOpacity
                                    style={[s.avatar, { backgroundColor: isDark ? "#202c33" : "#f0f0f0" }]}
                                    onPress={openPickerMenu}
                                    activeOpacity={0.8}
                                >
                                    {profilePic ? (
                                        <Animated.Image source={{ uri: profilePic }} style={s.avatarImg} />
                                    ) : (
                                        <Text style={[s.avatarTxt, { color: isDark ? "#00a884" : "#1a1a2e" }]}>
                                            {user?.username?.charAt(0)?.toUpperCase()}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={[s.cameraBtn, { backgroundColor: isDark ? "#00a884" : "#1a1a2e" }]} onPress={openPickerMenu}>
                                <Ionicons name="camera" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={s.infoContainer}>
                            {/* Name Card */}
                            <View style={[s.card, { backgroundColor: surface }]}>
                                <View style={s.cardIcon}>
                                    <Ionicons name="person" size={20} color={isDark ? "#00a884" : "#1a1a2e"} />
                                </View>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>Name</Text>
                                    <TextInput
                                        style={[s.input, { color: textMain }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter your name"
                                        placeholderTextColor={textSub}
                                    />
                                </View>
                                <TouchableOpacity style={s.editIconBtn}>
                                    <Ionicons name="pencil" size={18} color={textSub} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[s.helperText, { color: textSub }]}>
                                This name will be visible to your Talksy contacts.
                            </Text>

                            {/* About Card */}
                            <View style={[s.card, { backgroundColor: surface, marginTop: 24 }]}>
                                <View style={s.cardIcon}>
                                    <Ionicons name="information-circle" size={22} color={isDark ? "#00a884" : "#1a1a2e"} />
                                </View>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>About</Text>
                                    <TextInput
                                        style={[s.input, { color: textMain }]}
                                        value={about}
                                        onChangeText={setAbout}
                                        placeholder="Available"
                                        placeholderTextColor={textSub}
                                    />
                                </View>
                                <TouchableOpacity style={s.editIconBtn}>
                                    <Ionicons name="pencil" size={18} color={textSub} />
                                </TouchableOpacity>
                            </View>

                            {/* Phone Number Card (Read Only) */}
                            <View style={[s.card, { backgroundColor: surface, marginTop: 24 }]}>
                                <View style={s.cardIcon}>
                                    <Ionicons name="call" size={20} color={isDark ? "#00a884" : "#1a1a2e"} />
                                </View>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>Phone</Text>
                                    <Text style={[s.phoneText, { color: textMain }]}>{user.mobile}</Text>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                </View>
                
                {/* Save Button (Fixed at Bottom) */}
                <View style={s.bottomContainer}>
                    <TouchableOpacity
                        style={[s.saveBtn, { backgroundColor: isDark ? "#00a884" : "#1a1a2e" }]}
                        onPress={saveProfile}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.saveBtnTxt}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Custom Image Picker Modal */}
            <Modal visible={showPickerMenu} transparent animationType="fade" onRequestClose={closePickerMenu}>
                <View style={s.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closePickerMenu} />
                    <Animated.View style={[s.pickerMenu, { backgroundColor: surface, transform: [{ scale: menuAnim }] }]}>
                        <Text style={[s.pickerTitle, { color: textMain }]}>Profile photo</Text>

                        <View style={s.pickerOptions}>
                            <TouchableOpacity style={s.pickerItem} onPress={() => pickImage('camera')}>
                                <View style={[s.pickerIconBg, { backgroundColor: "#e91e63" }]}>
                                    <Ionicons name="camera" size={24} color="#fff" />
                                </View>
                                <Text style={[s.pickerLabel, { color: textSub }]}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.pickerItem} onPress={() => pickImage('gallery')}>
                                <View style={[s.pickerIconBg, { backgroundColor: "#9c27b0" }]}>
                                    <Ionicons name="images" size={24} color="#fff" />
                                </View>
                                <Text style={[s.pickerLabel, { color: textSub }]}>Gallery</Text>
                            </TouchableOpacity>

                            {profilePic ? (
                                <TouchableOpacity style={s.pickerItem} onPress={() => { setProfilePic(""); closePickerMenu(); }}>
                                    <View style={[s.pickerIconBg, { backgroundColor: "#f44336" }]}>
                                        <Ionicons name="trash" size={24} color="#fff" />
                                    </View>
                                    <Text style={[s.pickerLabel, { color: textSub }]}>Remove</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row", alignItems: "center",
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
    scrollViewWrapper: { flex: 1, paddingBottom: 100 },
    
    avatarWrap: { alignSelf: "center", marginTop: 20, marginBottom: 40, position: "relative" },
    avatarShadow: {
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 15,
        borderRadius: 80,
    },
    avatar: {
        width: 150, height: 150, borderRadius: 75,
        justifyContent: "center", alignItems: "center",
        overflow: "hidden"
    },
    avatarTxt: { fontSize: 60, fontWeight: "bold" },
    avatarImg: { width: "100%", height: "100%" },
    cameraBtn: {
        position: "absolute", bottom: 0, right: 0,
        width: 48, height: 48, borderRadius: 24,
        justifyContent: "center", alignItems: "center",
        borderWidth: 4, borderColor: "transparent",
        elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3
    },

    infoContainer: { paddingHorizontal: 24 },
    card: {
        flexDirection: "row", alignItems: "center",
        padding: 16, borderRadius: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardIcon: { width: 40, justifyContent: "center", alignItems: "flex-start" },
    cardContent: { flex: 1 },
    cardLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
    input: { fontSize: 16, fontWeight: "600", padding: 0, margin: 0 },
    phoneText: { fontSize: 16, fontWeight: "600" },
    editIconBtn: { padding: 8 },
    helperText: { fontSize: 12, marginTop: 10, marginLeft: 56, marginRight: 16, opacity: 0.8 },
    
    bottomContainer: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingVertical: 20,
        backgroundColor: "transparent"
    },
    saveBtn: {
        paddingVertical: 18, borderRadius: 16,
        justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    saveBtnTxt: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    pickerMenu: { width: "85%", borderRadius: 24, padding: 24, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    pickerTitle: { fontSize: 20, fontWeight: "700", marginBottom: 24, textAlign: "center" },
    pickerOptions: { flexDirection: "row", justifyContent: "space-around" },
    pickerItem: { alignItems: "center", padding: 10 },
    pickerIconBg: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 3 },
    pickerLabel: { fontSize: 14, fontWeight: "600" },
});
