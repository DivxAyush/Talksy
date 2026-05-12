import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";
import { spacing, radius } from "../theme/designTokens";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const s = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  msgList: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    justifyContent: "flex-end",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    transform: [{ scaleY: -1 }],
  },
  emptyTxt: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },
  
  // Attachment Menu
  attachMenu: {
    position: "absolute",
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    flexDirection: "row",
    gap: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  attachItem: { alignItems: "center", gap: spacing.sm },
  attachIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  attachTxt: { fontSize: 12, fontWeight: "600" },

  // Media Viewer (legacy — kept for any direct usage)
  viewerOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
  viewerCaption: {
    position: "absolute",
    bottom: 50,
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.card,
  },
  viewerCaptionTxt: { color: "#fff", fontSize: 15, textAlign: "center" },
});
