
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Login from "./src/Components/Login";
import Register from "./src/Components/Register";
import Home from "./src/Components/Home";
import ChatUser from "./src/screens/chatUser";

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

    setLoading(false);
  };

  useEffect(() => {
    checkLogin();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>

      <Stack.Navigator>

        {isLoggedIn ? (
          <>
            <Stack.Screen
              name="Home"
              options={{ headerShown: false }}
            >
              {(props) => (
                <Home {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="chatUser"
              component={ChatUser}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => (
                <Login {...props} setIsLoggedIn={setIsLoggedIn} />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Register"
              component={Register}
              options={{ headerShown: false }}
            />
          </>
        )}

      </Stack.Navigator>

    </NavigationContainer>
  );
}

