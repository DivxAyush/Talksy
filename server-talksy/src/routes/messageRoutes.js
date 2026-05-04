import {
 sendMessage,
 getMessages,
 getConversations,
 markAsRead,
 deleteMessage
} from "../controllers/messageController.js";

export default async function messageRoutes(fastify, options) {

 // Send a new message
 fastify.post("/send-message", sendMessage);

 // Get paginated messages between two users
 fastify.get("/messages/:senderId/:receiverId", getMessages);

 // Get conversations list (chat inbox) for a user
 fastify.get("/conversations/:userId", getConversations);

 // Mark messages as read (bulk)
 fastify.put("/read", markAsRead);

 // Delete a message
 fastify.put("/delete/:messageId", deleteMessage);

}