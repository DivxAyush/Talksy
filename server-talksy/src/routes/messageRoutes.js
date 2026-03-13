import { sendMessage, getMessages } from "../controllers/messageController.js";

export default async function messageRoutes(fastify, options) {

 fastify.post("/send-message", sendMessage);

 fastify.get("/messages/:senderId/:receiverId", getMessages);

}