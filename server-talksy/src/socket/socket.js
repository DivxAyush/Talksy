import { Server } from "socket.io";
import UserMessage from "../models/userMessage.js";

let io;
const userSocketMap = {}; // { userId: socketId }

export const initSocket = (server) => {
 io = new Server(server, {
  cors: {
   origin: "*",
   methods: ["GET", "POST"]
  },
  pingInterval: 25000,
  pingTimeout: 60000
 });

 io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
   userSocketMap[userId] = socket.id;
  }

  // Broadcast updated online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ─── Deliver pending messages when user comes online ───
  if (userId && userId !== "undefined") {
   deliverPendingMessages(userId);
  }

  // ─── Typing Indicators ───
  socket.on("typing_start", ({ senderId, receiverId }) => {
   const receiverSocketId = userSocketMap[receiverId];
   if (receiverSocketId) {
    io.to(receiverSocketId).emit("typing_start", { senderId });
   }
  });

  socket.on("typing_stop", ({ senderId, receiverId }) => {
   const receiverSocketId = userSocketMap[receiverId];
   if (receiverSocketId) {
    io.to(receiverSocketId).emit("typing_stop", { senderId });
   }
  });

  // ─── Message Delivered Acknowledgement ───
  socket.on("message_delivered", async ({ messageId, senderId }) => {
   try {
    await UserMessage.findByIdAndUpdate(messageId, { status: "delivered" });
    // Notify the original sender that their message was delivered
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
     io.to(senderSocketId).emit("message_status_update", {
      messageId,
      status: "delivered"
     });
    }
   } catch (err) {
    console.error("Error updating delivery status:", err.message);
   }
  });

  // ─── Message Read Acknowledgement ───
  socket.on("message_read", async ({ messageIds, senderId }) => {
   try {
    if (!messageIds || messageIds.length === 0) return;

    // Bulk update all messages to "read"
    await UserMessage.updateMany(
     { _id: { $in: messageIds }, status: { $ne: "read" } },
     { status: "read" }
    );

    // Notify sender that their messages were read
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
     io.to(senderSocketId).emit("messages_read", {
      messageIds,
      status: "read"
     });
    }
   } catch (err) {
    console.error("Error updating read status:", err.message);
   }
  });

  // ─── Message Deleted ───
  socket.on("delete_message", async ({ messageId, userId, deleteForEveryone }) => {
   try {
    if (deleteForEveryone) {
     // Soft-delete for everyone
     await UserMessage.findByIdAndUpdate(messageId, {
      isDeleted: true,
      message: "This message was deleted"
     });

     // Find the message to notify the other party
     const msg = await UserMessage.findById(messageId);
     if (msg) {
      const otherUserId = msg.senderId.toString() === userId
       ? msg.receiverId.toString()
       : msg.senderId.toString();

      const otherSocketId = userSocketMap[otherUserId];
      if (otherSocketId) {
       io.to(otherSocketId).emit("message_deleted", {
        messageId,
        deleteForEveryone: true
       });
      }
     }

     // Confirm to the deleter
     socket.emit("message_deleted", { messageId, deleteForEveryone: true });
    } else {
     // Delete for me only — add userId to deletedFor array
     await UserMessage.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId }
     });
     socket.emit("message_deleted", { messageId, deleteForEveryone: false });
    }
   } catch (err) {
    console.error("Error deleting message:", err.message);
   }
  });

  // ─── Disconnect ───
  socket.on("disconnect", () => {
   console.log("User disconnected:", socket.id);
   if (userId) {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
   }
  });
 });
};

// Deliver pending "sent" messages when receiver comes online
async function deliverPendingMessages(userId) {
 try {
  const pendingMessages = await UserMessage.find({
   receiverId: userId,
   status: "sent",
   isDeleted: false
  });

  if (pendingMessages.length > 0) {
   // Update all to delivered
   const messageIds = pendingMessages.map(m => m._id);
   await UserMessage.updateMany(
    { _id: { $in: messageIds } },
    { status: "delivered" }
   );

   // Notify each sender about delivery
   const senderGroups = {};
   pendingMessages.forEach(msg => {
    const sid = msg.senderId.toString();
    if (!senderGroups[sid]) senderGroups[sid] = [];
    senderGroups[sid].push(msg._id.toString());
   });

   Object.entries(senderGroups).forEach(([senderId, msgIds]) => {
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
     msgIds.forEach(msgId => {
      io.to(senderSocketId).emit("message_status_update", {
       messageId: msgId,
       status: "delivered"
      });
     });
    }
   });
  }
 } catch (err) {
  console.error("Error delivering pending messages:", err.message);
 }
}

export const getReceiverSocketId = (receiverId) => {
 return userSocketMap[receiverId];
};

export { io };
