
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function ChatUser({ route, navigation }) {

 const { user } = route.params;

 // TODO: login ke baad apna userId yaha set karna
 const receiverId = user._id || user.id;
 const [messages, setMessages] = useState([]);
 const [text, setText] = useState("");
 const [senderId, setSenderId] = useState("");

 useEffect(() => {

  const getUser = async () => {

   const id = await AsyncStorage.getItem("userId");
   console.log("Sender:", id);

   setSenderId(id);

  };

  getUser();

 }, []);
 // GET MESSAGES
 const loadMessages = async () => {
  try {
   console.log("Sender:", senderId);
   console.log("Receiver:", receiverId);
   console.log("Message:", text);
   const res = await axios.get(`https://talksy-3py1.onrender.com/api/messages/messages/${senderId}/${receiverId}`);

   setMessages(res.data.messages);

  } catch (err) {
   console.log(err);
  }
 };

useEffect(() => {
 if (senderId) {
  loadMessages();
 }
}, [senderId]);
useEffect(() => {

 if (!senderId) return;

 const interval = setInterval(() => {
  loadMessages();
 }, 3000); // 3 seconds

 return () => clearInterval(interval);

}, [senderId]);

 // SEND MESSAGE
 const sendMessage = async () => {

  if (!senderId) return;   // 👈 yaha lagana hai
  if (!text.trim()) return;

  try {
   console.log("Sender:", senderId);
   console.log("Receiver:", receiverId);
   console.log("Message:", text);
   await axios.post(
    "https://talksy-3py1.onrender.com/api/messages/send-message",
    { senderId, receiverId, message: text }
   );

   setText("");
   loadMessages();

  } catch (err) {
   console.log("ERROR:", err.response?.data);
  }

 };

 const renderItem = ({ item }) => {

  const isMe = item.senderId === senderId;

  return (
   <View
    style={[
     styles.messageBubble,
     isMe ? styles.myMessage : styles.otherMessage
    ]}
   >
    <Text style={styles.messageText}>{item.message}</Text>
   </View>
  );
 };

 return (
  <View style={styles.container}>

   {/* HEADER */}
   <View style={styles.header}>

    <TouchableOpacity onPress={() => navigation.goBack()}>
     <Ionicons name="arrow-back" size={24} />
    </TouchableOpacity>

    <View style={styles.userInfo}>

     <View style={styles.avatar}>
      <Text style={styles.avatarText}>
       {user.name || "U"}
      </Text>
     </View>

     <Text style={styles.username}>{user.name}</Text>

    </View>

   </View>

   {/* MESSAGES */}

   <FlatList
    data={messages}
    keyExtractor={(item) => item._id}
    renderItem={renderItem}
    contentContainerStyle={{ padding: 10 }}
   />

   {/* INPUT */}

   <View style={styles.inputContainer}>

    <TextInput
     placeholder="Type a message"
     style={styles.input}
     value={text}
     onChangeText={setText}
    />

    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
     <Text style={{ color: "#fff" }}>Send</Text>
    </TouchableOpacity>

   </View>

  </View>
 );
}

const styles = StyleSheet.create({

 container: {
  flex: 1,
  backgroundColor: "#fff"
 },

 header: {
  flexDirection: "row",
  alignItems: "center",
  paddingTop: 50,
  paddingHorizontal: 15,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderColor: "#eee"
 },

 userInfo: {
  flexDirection: "row",
  alignItems: "center",
  marginLeft: 10
 },

 avatar: {
  width: 35,
  height: 35,
  borderRadius: 18,
  backgroundColor: "#5f7cff",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8
 },

 avatarText: {
  color: "#fff",
  fontWeight: "bold"
 },

 username: {
  fontSize: 18,
  fontWeight: "600"
 },

 messageBubble: {
  padding: 10,
  borderRadius: 10,
  marginVertical: 5,
  maxWidth: "70%"
 },

 myMessage: {
  backgroundColor: "#DCF8C6",
  alignSelf: "flex-end"
 },

 otherMessage: {
  backgroundColor: "#eee",
  alignSelf: "flex-start"
 },

 messageText: {
  fontSize: 16
 },

 inputContainer: {
  flexDirection: "row",
  padding: 10,
  borderTopWidth: 1,
  borderColor: "#ddd"
 },

 input: {
  flex: 1,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 20,
  paddingHorizontal: 15
 },

 sendBtn: {
  backgroundColor: "#007AFF",
  marginLeft: 10,
  paddingHorizontal: 20,
  justifyContent: "center",
  borderRadius: 20
 }

});
