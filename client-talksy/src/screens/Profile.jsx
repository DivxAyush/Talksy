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
import { SocketContext } from "../context/SocketContext";

const API = "https://talksy-3py1.onrender.com/api/users";

export default function Profile({ navigation }) {
    const { isDark } = useContext(ThemeContext);
    const { socket } = useContext(SocketContext);

    const [user, setUser] = useState(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [about, setAbout] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showPickerMenu, setShowPickerMenu] = useState(false);
    const menuAnim = React.useRef(new Animated.Value(0)).current;

    // Toast Animation
    const [toastMessage, setToastMessage] = useState("");
    const toastAnim = React.useRef(new Animated.Value(50)).current;

    // Dynamic Theme Colors
    const bg = isDark ? "#121212" : "#F7ECE9";
    const headerBg = isDark ? "#1C1C1E" : "#F7ECE9";
    const surface = isDark ? "#1C1C1E" : "#FFFFFF";
    const textMain = isDark ? "#FFFFFF" : "#2B1F1A";
    const textSub = isDark ? "#A1A1A6" : "#8E5A55";
    const border = isDark ? "#2A2A2D" : "#F1D7D1";
    const copper = "#C4734A";

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const parsedUser = JSON.parse(userStr);
                    setUser(parsedUser);
                    setName(parsedUser.name || "");
                    setUsername(parsedUser.username || "");
                    setAbout(parsedUser.about || "");
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

    const showToast = (msg) => {
        setToastMessage(msg);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.delay(1500),
            Animated.timing(toastAnim, { toValue: 50, duration: 300, useNativeDriver: true })
        ]).start();
    };

    const saveProfile = async () => {
        if (!user?._id) return;

        setSaving(true);
        try {
            const { data } = await axios.put(`${API}/profile/${user._id}`, {
                name: name.trim(),
                username: username.trim(),
                about: about.trim(),
                profilePic
            });

            if (data.success) {
                await AsyncStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                showToast("Profile updated successfully");

                // Emit profile update via socket for real-time sync
                if (socket) {
                    socket.emit("profile_updated", {
                        userId: user._id,
                        name: data.user.name,
                        username: data.user.username,
                        profilePic: data.user.profilePic,
                        about: data.user.about,
                    });
                }

                setTimeout(() => navigation.goBack(), 1000);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.data?.message === "Username already exists") {
                showToast("Username already exists");
            } else {
                showToast("Failed to update profile");
            }
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <View style={[s.container, { backgroundColor: bg }]}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: bg }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBackBtn}>
                    <Ionicons name="arrow-back" size={24} color={textMain} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: textMain }]}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={s.scrollViewWrapper}>
                    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
                        {/* Avatar Section */}
                        <View style={s.avatarWrap}>
                            <TouchableOpacity
                                style={[s.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F1D7D1" }]}
                                onPress={openPickerMenu}
                                activeOpacity={0.8}
                            >
                                {profilePic ? (
                                    <Animated.Image source={{ uri: profilePic }} style={s.avatarImg} />
                                ) : (
                                    <Text style={[s.avatarTxt, { color: isDark ? "#fff" : "#C4734A" }]}>
                                        {user?.username?.charAt(0)?.toUpperCase()}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.cameraBtn, { backgroundColor: copper }]} onPress={openPickerMenu}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={s.profileNamesContainer}>
                            <Text style={[s.displayName, { color: textMain }]}>{user?.name || user?.username || "Klyro User"}</Text>
                            <Text style={[s.displayUsername, { color: textSub }]}>@{user?.username || "username"}</Text>
                        </View>

                        <View style={s.infoContainer}>
                            {/* Full Name / Nickname Card */}
                            <View style={[s.card, { borderColor: border, backgroundColor: surface }]}>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>Nickname / Full name</Text>
                                    <TextInput
                                        style={[s.input, { color: textMain }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Your name"
                                        placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
                                    />
                                </View>
                            </View>

                            {/* Username Card */}
                            <View style={[s.card, { borderColor: border, backgroundColor: surface, marginTop: 12 }]}>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>Username</Text>
                                    <TextInput
                                        style={[s.input, { color: textSub }]}
                                        value={username}
                                        onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
                                        placeholder="e.g. klyro_user"
                                        placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
                                        autoCapitalize="none"
                                        editable={false}
                                    />
                                </View>
                            </View>


                            {/* Phone Number Card */}
                            <View style={[s.card, { borderColor: border, backgroundColor: surface, marginTop: 12 }]}>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>Phone number</Text>
                                    <Text disabled style={[s.input, { color: textMain }]}>{user?.mobile || ""}</Text>
                                </View>
                            </View>

                            {/* About Card */}
                            <View style={[s.card, { borderColor: border, backgroundColor: surface, marginTop: 12 }]}>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardLabel, { color: textSub }]}>About</Text>
                                    <TextInput
                                        style={[s.input, { color: textMain }]}
                                        value={about}
                                        onChangeText={setAbout}
                                        placeholder="Your about or email"
                                        placeholderTextColor={isDark ? "#636366" : "#B08F8A"}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Save Button */}
                        <View style={s.bottomContainer}>
                            <TouchableOpacity
                                style={[s.saveBtn, { backgroundColor: copper }]}
                                onPress={saveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={s.saveBtnTxt}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </View>

                {/* Animated Toast Tooltip */}
                <Animated.View style={[s.toast, { transform: [{ translateY: toastAnim }], opacity: toastMessage ? 1 : 0 }]}>
                    <Text style={s.toastTxt}>{toastMessage}</Text>
                </Animated.View>
            </KeyboardAvoidingView>

            {/* Custom Image Picker Modal - Compact */}
            <Modal visible={showPickerMenu} transparent animationType="fade" onRequestClose={closePickerMenu}>
                <View style={s.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closePickerMenu} />
                    <Animated.View style={[s.pickerMenu, { backgroundColor: surface, transform: [{ scale: menuAnim }] }]}>
                        <View style={s.pickerOptions}>
                            <TouchableOpacity style={s.pickerItem} onPress={() => pickImage('camera')}>
                                <Ionicons name="camera-outline" size={28} color={textMain} />
                                <Text style={[s.pickerLabel, { color: textMain }]}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.pickerItem} onPress={() => pickImage('gallery')}>
                                <Ionicons name="image-outline" size={28} color={textMain} />
                                <Text style={[s.pickerLabel, { color: textMain }]}>Gallery</Text>
                            </TouchableOpacity>

                            {profilePic ? (
                                <TouchableOpacity style={s.pickerItem} onPress={() => { setProfilePic(""); closePickerMenu(); }}>
                                    <Ionicons name="trash-outline" size={28} color="#e74c3c" />
                                    <Text style={[s.pickerLabel, { color: "#e74c3c" }]}>Remove</Text>
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
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    },
    headerBackBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "600" },
    scrollViewWrapper: { flex: 1, paddingBottom: 100 },

    avatarWrap: { alignSelf: "center", marginTop: 10, marginBottom: 12, position: "relative" },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: "center", alignItems: "center",
        overflow: "hidden"
    },
    avatarTxt: { fontSize: 32, fontWeight: "bold" },
    avatarImg: { width: "100%", height: "100%" },
    cameraBtn: {
        position: "absolute", bottom: 2, right: 2,
        width: 24, height: 24, borderRadius: 12,
        justifyContent: "center", alignItems: "center",
        borderWidth: 2, borderColor: "#fff"
    },
    profileNamesContainer: { alignItems: "center", marginBottom: 30 },
    displayName: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
    displayUsername: { fontSize: 13 },

    infoContainer: { paddingHorizontal: 24 },
    card: {
        paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 12, borderWidth: 1,
    },
    rowCards: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    halfCard: { width: "48%" },
    cardContent: { justifyContent: "center" },
    cardLabel: { fontSize: 11, fontWeight: "400", marginBottom: 2 },
    input: { fontSize: 14, fontWeight: "600", padding: 0, margin: 0 },

    bottomContainer: {
        marginTop: 30,
        marginBottom: 20,
        paddingHorizontal: 24,
    },
    saveBtn: {
        paddingVertical: 16, borderRadius: 12,
        justifyContent: "center", alignItems: "center",
    },
    saveBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },

    toast: {
        position: "absolute", bottom: 90, alignSelf: "center",
        backgroundColor: "#333", paddingVertical: 10, paddingHorizontal: 20,
        borderRadius: 20, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3
    },
    toastTxt: { color: "#fff", fontSize: 14, fontWeight: "500" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    pickerMenu: { width: "70%", borderRadius: 16, paddingVertical: 20, paddingHorizontal: 10 },
    pickerOptions: { flexDirection: "row", justifyContent: "space-around" },
    pickerItem: { alignItems: "center", padding: 10 },
    pickerLabel: { fontSize: 14, fontWeight: "500", marginTop: 8 },
});
