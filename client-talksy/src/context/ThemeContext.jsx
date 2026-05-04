import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
 const [isDark, setIsDark] = useState(false);
 const [themeLoaded, setThemeLoaded] = useState(false);

 useEffect(() => {
  (async () => {
   const saved = await AsyncStorage.getItem("theme");
   if (saved === "dark") setIsDark(true);
   setThemeLoaded(true);
  })();
 }, []);

 const toggleTheme = async (mode) => {
  const dark = mode === "dark";
  setIsDark(dark);
  await AsyncStorage.setItem("theme", dark ? "dark" : "light");
 };

 if (!themeLoaded) return null;

 return (
  <ThemeContext.Provider value={{ isDark, toggleTheme }}>
   {children}
  </ThemeContext.Provider>
 );
};
