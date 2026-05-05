import React, { useEffect, useState, useContext, useRef } from "react";
import { StatusBar, AppState } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import Login from "./src/Components/Login";
import Register from "./src/Components/Register";
import Home from "./src/Components/Home";
import ChatUser from "./src/screens/chatUser";
import Settings from "./src/screens/Settings";
import Profile from "./src/screens/Profile";
import NewChat from "./src/screens/NewChat";
import ForgotPassword from "./src/screens/ForgotPassword";
import VerifyOTP from "./src/screens/VerifyOTP";
import ChangePassword from "./src/screens/ChangePassword";
import Splash from "./src/Components/Splash";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import { ChatProvider } from "./src/context/ChatContext";
import { SocketProvider } from "./src/context/SocketContext";
import { initializePushNotifications } from "./src/utils/notificationService";

const Stack = createNativeStackNavigator();

const MainApp = () => {
 const [loading, setLoading] = useState(true);
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const { isDark } = useContext(ThemeContext);
 const navigationRef = useRef(null);
 const notificationResponseListener = useRef(null);

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

 // ─── Initialize Push Notifications when logged in ───
 useEffect(() => {
  if (isLoggedIn) {
   initializePushNotifications();
  }
 }, [isLoggedIn]);

 // ─── Handle notification tap → navigate to chat ───
 useEffect(() => {
  notificationResponseListener.current =
   Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === "new_message" && data?.senderId) {
     // Navigate to the chat with the sender
     // We'll navigate once navigation is ready
     setTimeout(() => {
      if (navigationRef.current) {
       navigationRef.current.navigate("chatUser", {
        user: { _id: data.senderId }
       });
      }
     }, 500);
    }
   });

  return () => {
   if (notificationResponseListener.current) {
    Notifications.removeNotificationSubscription(notificationResponseListener.current);
   }
  };
 }, []);

 if (loading) return <Splash />;

 const navTheme = isDark ? {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#111b21" }
 } : {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#fff" }
 };

 return (
  <ChatProvider>
   <SocketProvider isLoggedIn={isLoggedIn}>
    <NavigationContainer theme={navTheme} ref={navigationRef}>
     <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#111b21" : "#fff"} />
     <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
       <>
        <Stack.Screen name="Home">
         {(props) => <Home {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="chatUser" component={ChatUser} />
        <Stack.Screen name="NewChat" component={NewChat} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="Settings" options={{ animation: "slide_from_right" }}>
         {(props) => <Settings {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="Profile" component={Profile} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTP} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ animation: "slide_from_right" }} />
       </>
      ) : (
       <>
        <Stack.Screen name="Login">
         {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="Register">
         {(props) => <Register {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTP} options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ animation: "slide_from_right" }} />
       </>
      )}
     </Stack.Navigator>
    </NavigationContainer>
   </SocketProvider>
  </ChatProvider>
 );
};

export default function App() {
 return (
  <ThemeProvider>
   <MainApp />
  </ThemeProvider>
 );
}