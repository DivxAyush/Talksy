import UserMessage from "../models/userMessage.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (request, reply) => {
 try {

  const { senderId, receiverId, message } = request.body;

  const newMessage = new UserMessage({ senderId, receiverId, message });

  await newMessage.save();

  // SOCKET functionality to emit message in real-time
  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
   io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  return {
   success: true,
   message: "Message sent",
   data: newMessage
  };

 } catch (error) {

  reply.code(500).send({
   success: false,
   message: error.message
  });

 }
};


export const getMessages = async (request, reply) => {
 try {

  const { senderId, receiverId } = request.params;

  const messages = await UserMessage.find({
   $or: [
    { senderId: senderId, receiverId: receiverId },
    { senderId: receiverId, receiverId: senderId }
   ]
  }).sort({ createdAt: 1 });

  return {
   success: true,
   messages
  };

 } catch (error) {

  reply.code(500).send({ success: false, message: error.message });

 }
};