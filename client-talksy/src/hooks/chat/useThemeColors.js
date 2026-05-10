import { useContext, useMemo } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export const useThemeColors = () => {
  const { isDark } = useContext(ThemeContext);

  const colors = useMemo(() => ({
    isDark,
    bg: isDark ? "#0b141a" : "#fafafa",
    headerBg: isDark ? "#202c33" : "#fff",
    surface: isDark ? "#202c33" : "#f5f5f5",
    textMain: isDark ? "#e9edef" : "#1a1a2e",
    textSub: isDark ? "#8696a0" : "#999",
    border: isDark ? "#202c33" : "#f0f0f0",
    myBubble: isDark ? "#005c4b" : "#1a1a2e",
    otherBubble: isDark ? "#202c33" : "#f0f0f0",
    myBubbleTxt: isDark ? "#e9edef" : "#fff",
    otherBubbleTxt: isDark ? "#e9edef" : "#1a1a2e",
    accentPurple: "#a855f7",
  }), [isDark]);

  return colors;
};
