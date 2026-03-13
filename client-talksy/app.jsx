import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Register from "./src/Components/Register";
import Home from "./src/Components/Home";
import Login from "./src/Components/Login";
import Splash from "./src/Components/Splash";
import chatUser from "./src/screens/chatUser";


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }} >
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
       <Stack.Screen  name="chatUser" component={chatUser}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}