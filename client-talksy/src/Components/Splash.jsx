import React, { useEffect } from "react";
import { View, ImageBackground, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Splash() {

 const navigation = useNavigation();

 useEffect(() => {

  const timer = setTimeout(() => {
   navigation.replace("Register");
  }, 3000);

  return () => clearTimeout(timer);

 }, []);

 return (

  <ImageBackground
   source={require("../../assets/splas1.png")}
   style={styles.container}
   resizeMode="cover"
  >

   <View />

  </ImageBackground>

 );
}

const styles = StyleSheet.create({

 container: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center"
 }

});