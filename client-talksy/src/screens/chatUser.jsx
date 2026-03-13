
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function ChatUser({ route, navigation }) {

 const { user } = route.params;

 // TODO: login ke baad apna userId yaha set karna
 const senderId = "YOUR_LOGIN_USER_ID";
 const receiverId = user._id || user.id;
 const [messages, setMessages] = useState([]);
 const [text, setText] = useState("");

 // GET MESSAGES
 const loadMessages = async () => {
  try {

   const res = await axios.get(`http://YOUR_IP:5000/api/messages/messages/${senderId}/${receiverId}`);

   setMessages(res.data.messages);

  } catch (err) {
   console.log(err);
  }
 };

 useEffect(() => {
  loadMessages();
 }, []);

 // SEND MESSAGE
 const sendMessage = async () => {

  if (!text.trim()) return;

  try {
   await axios.post("http://YOUR_IP:5000/api/messages/send-message", { senderId, receiverId, message: text });
   setText("");
   loadMessages();

  } catch (err) {
   console.log(err);
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
       {user.name.charAt(0)}
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
