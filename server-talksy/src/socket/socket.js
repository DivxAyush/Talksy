import { Server } from "socket.io";

let io;
const userSocketMap = {}; // { userId: socketId }

export const initSocket = (server) => {
 io = new Server(server, {
  cors: {
   origin: "*",
   methods: ["GET", "POST"]
  }
 });

 io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
   userSocketMap[userId] = socket.id;
  }

  // Send the updated online users list to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
   console.log("User disconnected", socket.id);
   if (userId) {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
   }
  });
 });
};

export const getReceiverSocketId = (receiverId) => {
 return userSocketMap[receiverId];
};

export { io };
