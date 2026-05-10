// src/services/agoraService.js
/**
 * Agora Service (Expo Go Compatible Architecture)
 * Note: To use the real react-native-agora SDK, you must use an Expo Dev Client.
 * This service currently provides the architecture and mock methods so the app runs stably in Expo Go.
 * Once you eject or use EAS Build, you can drop in the real createAgoraRtcEngine.
 */

class AgoraService {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
  }

  async initialize(appId) {
    console.log(`[AgoraService] Initializing with App ID: ${appId}`);
    // Future integration: 
    // this.engine = createAgoraRtcEngine();
    // this.engine.initialize({ appId });
    this.isInitialized = true;
  }

  async joinChannel(token, channelName, uid) {
    console.log(`[AgoraService] Joining channel: ${channelName} with UID: ${uid}`);
    if (!this.isInitialized) throw new Error("Agora Engine not initialized");
    // Future integration:
    // this.engine.joinChannel(token, channelName, null, uid);
    return true;
  }

  async leaveChannel() {
    console.log("[AgoraService] Leaving channel");
    if (!this.isInitialized) return;
    // Future integration:
    // this.engine.leaveChannel();
  }

  async setMute(muted) {
    console.log(`[AgoraService] Muting audio: ${muted}`);
    // Future integration:
    // this.engine.muteLocalAudioStream(muted);
  }

  async setVideo(enabled) {
    console.log(`[AgoraService] Enabling video: ${enabled}`);
    // Future integration:
    // this.engine.muteLocalVideoStream(!enabled);
  }

  async switchCamera() {
    console.log("[AgoraService] Switching camera");
    // Future integration:
    // this.engine.switchCamera();
  }

  async destroy() {
    console.log("[AgoraService] Destroying engine");
    // Future integration:
    // this.engine.release();
    this.isInitialized = false;
  }
}

export const agoraService = new AgoraService();
