import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Login from "./src/Components/Login";
import Register from "./src/Components/Register";
import Home from "./src/Components/Home";
import ChatUser from "./src/screens/chatUser";
import Splash from "./src/Components/Splash";

const Stack = createNativeStackNavigator();

export default function App() {

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLogin = async () => {
    try {
      const user = await AsyncStorage.getItem("user");

      if (user) {
        setIsLoggedIn(true);
      }

    } catch (error) {
      console.log(error);
    }

    setTimeout(() => {
      setLoading(false);
    }, 4000); // splash time
  };

  useEffect(() => {
    checkLogin();
  }, []);

  // 🔥 Splash show hoga
  if (loading) return <Splash />;

  return (
    <NavigationContainer>

      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home">
              {(props) => (
                <Home {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="chatUser"
              component={ChatUser}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <Login {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Register">
              {(props) => (
                <Register {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>
          </>
        )}

      </Stack.Navigator>

    </NavigationContainer>
  );
}