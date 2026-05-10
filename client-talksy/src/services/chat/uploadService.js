import axios from "axios";

export const uploadMedia = async (asset, type, onProgress) => {
  const tempId = Date.now().toString();
  const uriParts = asset.uri.split(".");
  const ext = uriParts[uriParts.length - 1];
  const mime =
    type === "image" ? "image/jpeg" :
    type === "video" ? "video/mp4" :
    type === "voice" ? "audio/m4a" :
    "application/octet-stream";

  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: `media_${tempId}.${ext}`,
    type: mime
  });

  const { data } = await axios.post("https://talksy-3py1.onrender.com/api/messages/upload-media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (p) => {
      if (onProgress) onProgress(p.loaded / p.total);
    }
  });

  return data;
};
