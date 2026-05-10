import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const s = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  msgList: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, justifyContent: "flex-end" },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6, transform: [{ scaleY: -1 }] },
  emptyTxt: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },
  
  // Attachment Menu
  attachMenu: {
    position: "absolute", bottom: 80, left: 16, right: 16,
    padding: 20, borderRadius: 24, flexDirection: "row", gap: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  attachItem: { alignItems: "center", gap: 6 },
  attachIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  attachTxt: { fontSize: 12, fontWeight: "600" },

  // Media Viewer
  viewerOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
  viewerCaption: { position: "absolute", bottom: 50, left: 20, right: 20, padding: 15, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12 },
  viewerCaptionTxt: { color: "#fff", fontSize: 15, textAlign: "center" },
});
