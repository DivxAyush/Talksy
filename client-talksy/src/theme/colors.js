/**
 * Klyro Premium Color Palette
 * Warm copper / terracotta design language with soft peach surfaces
 */

const palette = {
  // ─── Core Brand ───
  copper: "#C4734A",
  copperLight: "#D4896A",
  copperDark: "#A85D3A",
  copperSoft: "rgba(196, 115, 74, 0.12)",
  copperGradientStart: "#D8BF6A",
  copperGradientEnd: "#C4734A",
  
  // ─── Accent / Status ───
  green: "#34C759",
  greenSoft: "rgba(52, 199, 89, 0.12)",
  blue: "#C4734A",
  blueSoft: "rgba(196, 115, 74, 0.15)",
  red: "#e74c3c",
  redSoft: "rgba(231, 76, 60, 0.1)",
  orange: "#D8BF6A",
  
  // ─── Neutrals ───
  white: "#ffffff",
  black: "#000000",
};

export const lightColors = {
  // ─── Backgrounds ───
  bg: "#F7ECE9",
  bgSecondary: "#F0DDD8",
  headerBg: "#F7ECE9",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  
  // ─── Text ───
  textPrimary: "#2B1F1A",
  textSecondary: "#8E5A55",
  textTertiary: "#B08F8A",
  textInverse: "#ffffff",
  
  // ─── Borders ───
  border: "#F1D7D1",
  borderLight: "#F5E3DE",
  divider: "#F1D7D1",
  
  // ─── Chat Bubbles ───
  myBubble: "#C4734A",
  otherBubble: "#FFFFFF",
  myBubbleText: "#ffffff",
  otherBubbleText: "#2B1F1A",
  myBubbleTime: "rgba(255,255,255,0.6)",
  otherBubbleTime: "#B08F8A",
  myBubbleOverlay: "rgba(255,255,255,0.12)",
  otherBubbleOverlay: "rgba(0,0,0,0.03)",
  
  // ─── Status Ticks ───
  tickDefault: "rgba(255,255,255,0.6)",
  tickRead: palette.copper,
  tickFailed: palette.red,
  
  // ─── Accents ───
  accent: palette.copper,
  accentSoft: palette.copperSoft,
  online: palette.copper,
  onlineSoft: "rgba(196, 115, 74, 0.12)",
  typing: palette.copper,
  replyAccent: palette.copper,
  
  // ─── Interactive ───
  pressedOverlay: "rgba(196, 115, 74, 0.06)",
  skeleton: "#F1D7D1",
  skeletonHighlight: "#F7ECE9",
  
  // ─── Date Header ───
  dateHeaderBg: "rgba(196, 115, 74, 0.08)",
  dateHeaderText: "#8E5A55",
  
  // ─── Unread Badge ───
  unreadBg: palette.copper,
  unreadText: palette.white,
  
  // ─── Misc ───
  danger: palette.red,
  dangerSoft: palette.redSoft,
  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.3)",
  
  // ─── Input ───
  inputBg: "#FFFFFF",
  inputPlaceholder: "#B08F8A",
  
  // ─── Tab Bar ───
  tabBarBg: "#FFFFFF",
  tabInactive: "#B08F8A",
  
  isDark: false,
};

export const darkColors = {
  // ─── Backgrounds ───
  bg: "#121212",
  bgSecondary: "#1A1A1A",
  headerBg: "#1C1C1E",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  
  // ─── Text ───
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1A6",
  textTertiary: "#636366",
  textInverse: "#121212",
  
  // ─── Borders ───
  border: "#2A2A2D",
  borderLight: "#1C1C1E",
  divider: "#2A2A2D",
  
  // ─── Chat Bubbles ───
  myBubble: "#C4734A",
  otherBubble: "#1C1C1E",
  myBubbleText: "#FFFFFF",
  otherBubbleText: "#FFFFFF",
  myBubbleTime: "rgba(255,255,255,0.55)",
  otherBubbleTime: "#636366",
  myBubbleOverlay: "rgba(255,255,255,0.1)",
  otherBubbleOverlay: "rgba(255,255,255,0.04)",
  
  // ─── Status Ticks ───
  tickDefault: "rgba(255,255,255,0.55)",
  tickRead: palette.copper,
  tickFailed: palette.red,
  
  // ─── Accents ───
  accent: palette.copper,
  accentSoft: "rgba(196, 115, 74, 0.18)",
  online: palette.copper,
  onlineSoft: "rgba(196, 115, 74, 0.15)",
  typing: palette.copper,
  replyAccent: palette.copperLight,
  
  // ─── Interactive ───
  pressedOverlay: "rgba(255,255,255,0.05)",
  skeleton: "#2C2C2E",
  skeletonHighlight: "#3A3A3C",
  
  // ─── Date Header ───
  dateHeaderBg: "rgba(255,255,255,0.06)",
  dateHeaderText: "#A1A1A6",
  
  // ─── Unread Badge ───
  unreadBg: palette.copper,
  unreadText: palette.white,
  
  // ─── Misc ───
  danger: palette.red,
  dangerSoft: "rgba(231, 76, 60, 0.12)",
  overlay: "rgba(0,0,0,0.6)",
  overlayLight: "rgba(0,0,0,0.4)",
  
  // ─── Input ───
  inputBg: "#2C2C2E",
  inputPlaceholder: "#636366",
  
  // ─── Tab Bar ───
  tabBarBg: "#1A1A1A",
  tabInactive: "#636366",
  
  isDark: true,
};

export { palette };
