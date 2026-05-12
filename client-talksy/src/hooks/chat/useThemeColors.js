import { useContext, useMemo } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { lightColors, darkColors } from "../../theme/colors";

export const useThemeColors = () => {
  const { isDark } = useContext(ThemeContext);

  const colors = useMemo(() => {
    const palette = isDark ? darkColors : lightColors;
    
    // Backward-compatible shape — existing components keep working
    return {
      isDark,
      // ─── Legacy keys (preserved for backward compat) ───
      bg: palette.bg,
      headerBg: palette.headerBg,
      surface: palette.surface,
      textMain: palette.textPrimary,
      textSub: palette.textSecondary,
      border: palette.border,
      myBubble: palette.myBubble,
      otherBubble: palette.otherBubble,
      myBubbleTxt: palette.myBubbleText,
      otherBubbleTxt: palette.otherBubbleText,
      accentPurple: palette.accent,
      
      // ─── Extended premium palette ───
      bgSecondary: palette.bgSecondary,
      surfaceElevated: palette.surfaceElevated,
      textTertiary: palette.textTertiary,
      textInverse: palette.textInverse,
      borderLight: palette.borderLight,
      divider: palette.divider,
      
      // Bubble extras
      myBubbleTime: palette.myBubbleTime,
      otherBubbleTime: palette.otherBubbleTime,
      myBubbleOverlay: palette.myBubbleOverlay,
      otherBubbleOverlay: palette.otherBubbleOverlay,
      
      // Ticks
      tickDefault: palette.tickDefault,
      tickRead: palette.tickRead,
      tickFailed: palette.tickFailed,
      
      // Accents
      accent: palette.accent,
      accentSoft: palette.accentSoft,
      online: palette.online,
      onlineSoft: palette.onlineSoft,
      typing: palette.typing,
      replyAccent: palette.replyAccent,
      
      // Interactive
      pressedOverlay: palette.pressedOverlay,
      skeleton: palette.skeleton,
      skeletonHighlight: palette.skeletonHighlight,
      
      // Date header
      dateHeaderBg: palette.dateHeaderBg,
      dateHeaderText: palette.dateHeaderText,
      
      // Unread
      unreadBg: palette.unreadBg,
      unreadText: palette.unreadText,
      
      // Misc
      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      overlay: palette.overlay,
      overlayLight: palette.overlayLight,
      
      // Input
      inputBg: palette.inputBg,
      inputPlaceholder: palette.inputPlaceholder,
      
      // Tab bar
      tabBarBg: palette.tabBarBg,
      tabInactive: palette.tabInactive,
    };
  }, [isDark]);

  return colors;
};
