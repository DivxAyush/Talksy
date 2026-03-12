import React, { useState } from "react";
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

const chats = Array.from({ length: 20 }, (_, i) => ({
 id: i.toString(),
 name: "User " + (i + 1),
 time: "4:20 AM"
}));

export default function Home() {
 const [search, setSearch] = useState("");
 const [filteredChats, setFilteredChats] = useState(chats);
 const handleSearch = (text) => {

  setSearch(text);

  if (text === "") {
   setFilteredChats(chats);
   return;
  }

  const filtered = chats.filter((item) =>
   item.name.toLowerCase().includes(text.toLowerCase())
  );

  setFilteredChats(filtered);

 };


 const renderItem = ({ item }) => (
  <TouchableOpacity style={styles.chatRow}>

   <View style={styles.chatLeft}>

    <View style={styles.avatar}>
     <Text style={styles.avatarText}>
      {item.name.charAt(0)}
     </Text>
    </View>

    <Text style={styles.chatName}>{item.name}</Text>

   </View>

   <Text style={styles.time}>{item.time}</Text>

  </TouchableOpacity>
 );

 return (

  <View style={styles.container}>

   {/* HEADER */}

   <LinearGradient
    colors={["#5f7cff", "#4a60e0"]}
    style={styles.header}
   >

    <Text style={styles.logo}>Talksy</Text>

    {/* SEARCH */}

    <View style={styles.searchBox}>

     <Ionicons name="search" size={20} color="#777" />

     <TextInput
      placeholder="Search for talk"
      style={styles.searchInput}
      value={search}
      onChangeText={handleSearch}
     />

    </View>

   </LinearGradient>

   {/* CHAT LIST */}

   <FlatList
    data={filteredChats}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
   />

   {/* BOTTOM MENU */}

   <View style={styles.bottomMenu}>

    <TouchableOpacity style={styles.menuItem}>
     <Ionicons name="chatbubble" size={22} color="#4a60e0" />
     <Text style={styles.menuText}>Chat</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem}>
     <Ionicons name="people" size={22} color="#888" />
     <Text style={styles.menuText}>Contact</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem}>
     <Ionicons name="person" size={22} color="#888" />
     <Text style={styles.menuText}>Profile</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem}>
     <Ionicons name="settings" size={22} color="#888" />
     <Text style={styles.menuText}>Setting</Text>
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
  justifyContent: "space-between",
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
 },

 time: {
  color: "#888",
  fontSize: 12
 },

 bottomMenu: {
  position: "absolute",
  bottom: 20,
  left: 20,
  right: 20,
  flexDirection: "row",
  justifyContent: "space-around",
  backgroundColor: "#fff",
  paddingVertical: 12,
  borderRadius: 20,
  elevation: 10
 },

 menuItem: {
  alignItems: "center"
 },

 menuText: {
  fontSize: 12,
  marginTop: 3
 }

});