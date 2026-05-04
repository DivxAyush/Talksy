import React, { useEffect, useState, useContext } from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Login from "./src/Components/Login";
import Register from "./src/Components/Register";
import Home from "./src/Components/Home";
import ChatUser from "./src/screens/chatUser";
import Settings from "./src/screens/Settings";
import Profile from "./src/screens/Profile";
import Splash from "./src/Components/Splash";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import { SocketProvider } from "./src/context/SocketContext";

const Stack = createNativeStackNavigator();

const MainApp = () => {
 const [loading, setLoading] = useState(true);
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const { isDark } = useContext(ThemeContext);

 const checkLogin = async () => {
  try {
   const user = await AsyncStorage.getItem("user");
   if (user) setIsLoggedIn(true);
  } catch (error) {
   console.log(error);
  }
  setTimeout(() => setLoading(false), 4000);
 };

 useEffect(() => { checkLogin(); }, []);

 if (loading) return <Splash />;

 const navTheme = isDark ? {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#111b21" }
 } : {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#fff" }
 };

 return (
  <SocketProvider isLoggedIn={isLoggedIn}>
   <NavigationContainer theme={navTheme}>
    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#111b21" : "#fff"} />
    <Stack.Navigator screenOptions={{ headerShown: false }}>
     {isLoggedIn ? (
      <>
       <Stack.Screen name="Home">
        {(props) => <Home {...props} setIsLoggedIn={setIsLoggedIn} />}
       </Stack.Screen>
       <Stack.Screen name="chatUser" component={ChatUser} />
       <Stack.Screen name="Settings" component={Settings} options={{ animation: "slide_from_right" }} />
       <Stack.Screen name="Profile" component={Profile} options={{ animation: "slide_from_right" }} />
      </>
     ) : (
      <>
       <Stack.Screen name="Login">
        {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
       </Stack.Screen>
       <Stack.Screen name="Register">
        {(props) => <Register {...props} setIsLoggedIn={setIsLoggedIn} />}
       </Stack.Screen>
      </>
     )}
    </Stack.Navigator>
   </NavigationContainer>
  </SocketProvider>
 );
};

export default function App() {
 return (
  <ThemeProvider>
   <MainApp />
  </ThemeProvider>
 );
}