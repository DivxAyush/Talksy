import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} resourceType - "image", "video", or "raw" (for audio)
 * @returns {Object} { url, publicId, format, bytes, duration }
 */
export const uploadToCloudinary = (buffer, folder = "talksy", resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                transformation: resourceType === "image"
                    ? [{ quality: "auto:good", fetch_format: "auto" }]
                    : undefined,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    bytes: result.bytes,
                    duration: result.duration || 0,
                    width: result.width,
                    height: result.height,
                });
            }
        );
        uploadStream.end(buffer);
    });
};

export default cloudinary;
