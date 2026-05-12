/**
 * Design Tokens — Centralized design system for Klyro
 * Consistent spacing, radius, typography, timing, and shadows
 */

// ─── Spacing Scale (4px base) ───
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 56,
};

// ─── Border Radius System ───
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  bubble: 18,
  bubbleTail: 4,
  card: 16,
  input: 22,
  avatar: {
    sm: 18,
    md: 22,
    lg: 25,
    xl: 45,
  },
};

// ─── Typography Hierarchy ───
export const typography = {
  // Headings
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "700" },
  
  // Body
  bodyLg: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  bodySm: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  
  // Labels
  label: { fontSize: 13, fontWeight: "600" },
  labelSm: { fontSize: 12, fontWeight: "600" },
  caption: { fontSize: 11, fontWeight: "500" },
  captionSm: { fontSize: 10, fontWeight: "500" },
  
  // Chat-specific
  chatName: { fontSize: 16.5, fontWeight: "700", letterSpacing: -0.2 },
  chatPreview: { fontSize: 14.5, lineHeight: 20 },
  messageTxt: { fontSize: 15.5, lineHeight: 22 },
  timestamp: { fontSize: 11, fontWeight: "400" },
  headerName: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
};

// ─── Animation Timing ───
export const timing = {
  instant: 100,
  fast: 150,
  normal: 200,
  smooth: 250,
  gentle: 300,
  slow: 400,
  
  // Spring configs (for Animated.spring)
  spring: {
    snappy: { tension: 300, friction: 20 },
    bouncy: { tension: 200, friction: 15 },
    gentle: { tension: 120, friction: 14 },
    smooth: { tension: 80, friction: 12 },
  },
};

// ─── Shadows ───
export const shadows = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadow for FAB — copper glow
  copper: {
    shadowColor: "#C4734A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  // Keep backward compat alias
  purple: {
    shadowColor: "#C4734A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
};

// ─── Icon Sizes ───
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  huge: 52,
};

// ─── Hit Slop for touch targets ───
export const hitSlop = {
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 10, bottom: 10, left: 10, right: 10 },
  lg: { top: 14, bottom: 14, left: 14, right: 14 },
};

// ─── Avatar Sizes ───
export const avatarSize = {
  xs: 28,
  sm: 36,
  md: 42,
  lg: 52,
  xl: 90,
  popup: 260,
};

// ─── Chat Bubble Constraints ───
export const bubble = {
  maxWidth: "80%",
  groupedGap: 2,
  ungroupedGap: 10,
  mediaDimension: 230,
  voiceWidth: 210,
};
