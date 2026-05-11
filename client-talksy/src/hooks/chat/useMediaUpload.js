import { useState, useContext } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { uploadMedia } from "../../services/chat/uploadService";
import { ChatContext } from "../../context/ChatContext";
import { NetworkContext } from "../../context/NetworkContext";

const API = "https://talksy-3py1.onrender.com/api/messages";

export const useMediaUpload = (senderId, receiverId, setMessages, replyMsg, setReplyMsg) => {
  const [uploadingMedia, setUploadingMedia] = useState({}); // { tempId: { progress, type, uri } }
  const { addMessageToCache } = useContext(ChatContext);
  const { isConnected } = useContext(NetworkContext);

  const handleMediaUpload = async (asset, type) => {
    if (!isConnected) {
      Alert.alert("Offline", "Cannot upload media while offline.");
      return;
    }

    const tempId = Date.now().toString();
    setUploadingMedia(prev => ({ ...prev, [tempId]: { progress: 0.1, type, uri: asset.uri } }));

    try {
      const data = await uploadMedia(asset, type, (progress) => {
        setUploadingMedia(prev => ({
          ...prev,
          [tempId]: { ...prev[tempId], progress }
        }));
      });

      if (data.success) {
        await sendMediaMessage(data.data.url, type, data.data);
      }
    } catch (err) {
      console.log("[useMediaUpload] Upload failed:", err);
      Alert.alert("Error", "Failed to upload media");
    } finally {
      setUploadingMedia(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    }
  };

  const sendMediaMessage = async (url, type, metadata) => {
    if (!senderId) return;

    try {
      const payload = {
        senderId,
        receiverId,
        messageType: type,
        mediaUrl: url,
        mediaSize: metadata?.size || 0,
        mediaDuration: metadata?.duration || 0,
        mediaThumbnail: metadata?.thumbnail || "",
        replyTo: replyMsg?._id
      };
      
      const { data } = await axios.post(`${API}/send-message`, payload);
      if (data.success) {
        setMessages(prev => [data.data, ...prev]);
        addMessageToCache(senderId, receiverId, data.data);
        setReplyMsg(null);
      }
    } catch (err) {
      console.log("[useMediaUpload] Send media message failed:", err.message);
    }
  };

  const pickImage = async (onCloseMenu) => {
    if (onCloseMenu) onCloseMenu();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) handleMediaUpload(result.assets[0], "image");
  };

  const pickVideo = async (onCloseMenu) => {
    if (onCloseMenu) onCloseMenu();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) handleMediaUpload(result.assets[0], "video");
  };

  return {
    uploadingMedia,
    handleMediaUpload,
    pickImage,
    pickVideo
  };
};
