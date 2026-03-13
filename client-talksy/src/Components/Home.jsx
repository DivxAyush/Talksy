
import React, { useEffect, useState } from "react";
import {
 View,
 Text,
 StyleSheet,
 TextInput,
 FlatList,
 TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function Home({ navigation }) {

 const [users, setUsers] = useState([]);
 const [search, setSearch] = useState("");
 const [filteredUsers, setFilteredUsers] = useState([]);

 // API CALL
 const loadUsers = async () => {
  try {

   const res = await axios.get("https://talksy-3py1.onrender.com/api/users/users");

   setUsers(res.data.users);
   setFilteredUsers(res.data.users);

  } catch (err) {
   console.log(err);
  }
 };

 useEffect(() => {
  loadUsers();
 }, []);

 const handleSearch = (text) => {

  setSearch(text);

  if (!text) {
   setFilteredUsers(users);
   return;
  }

  const filtered = users.filter((item) =>
   item.username.toLowerCase().includes(text.toLowerCase())
  );

  setFilteredUsers(filtered);

 };

 const renderItem = ({ item }) => (

  <TouchableOpacity
   style={styles.chatRow}
   onPress={() => navigation.navigate("chatUser", { user: item })}
  >

   <View style={styles.chatLeft}>

    <View style={styles.avatar}>
     <Text style={styles.avatarText}>
      {item?.username?.charAt(0)}
     </Text>
    </View>

    <Text style={styles.chatName}>{item.username}</Text>

   </View>

  </TouchableOpacity>

 );

 return (
  <View style={styles.container}>

   <LinearGradient colors={["#5f7cff", "#4a60e0"]} style={styles.header}>

    <Text style={styles.logo}>Talksy</Text>

    <View style={styles.searchBox}>
     <Ionicons name="search" size={20} color="#777" />
     <TextInput
      placeholder="Search user"
      style={styles.searchInput}
      value={search}
      onChangeText={handleSearch}
     />
    </View>

   </LinearGradient>

   <FlatList
    data={filteredUsers}
    keyExtractor={(item) => item._id}
    renderItem={renderItem}
   />

  </View>
 );
}

const styles = StyleSheet.create({

 container: { flex: 1, backgroundColor: "#fff" },

 header: {
  paddingTop: 60,
  paddingBottom: 25,
  paddingHorizontal: 20
 },

 logo: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "bold"
 },

 searchBox: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  marginTop: 15,
  paddingHorizontal: 12,
  borderRadius: 12
 },

 searchInput: {
  flex: 1,
  padding: 10,
  marginLeft: 5
 },

 chatRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderColor: "#f2f2f2"
 },

 chatLeft: {
  flexDirection: "row",
  alignItems: "center"
 },

 avatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#5f7cff",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12
 },

 avatarText: {
  color: "#fff",
  fontWeight: "bold"
 },

 chatName: {
  fontSize: 16
 }

});

