import {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    deleteMessage,
    markAsDelivered,
    uploadMedia
} from "../controllers/messageController.js";

export default async function messageRoutes(fastify, options) {

    // Send a new message
    fastify.post("/send-message", sendMessage);

    // Upload media (image/video/audio) to Cloudinary
    fastify.post("/upload-media", uploadMedia);

    // Get conversations list (chat inbox) for a user
    fastify.get("/conversations/:userId", getConversations);

    // Get paginated messages between two users
    fastify.get("/:senderId/:receiverId", getMessages);

    // Mark messages as read (bulk)
    fastify.put("/read", markAsRead);

    // Delete a message
    fastify.put("/delete/:messageId", deleteMessage);

    // Mark pending messages as delivered (called when app comes to foreground)
    fastify.post("/mark-delivered", markAsDelivered);

}