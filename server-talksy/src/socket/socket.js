import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import UserMessage from "../models/userMessage.js";

// ─── Constants ───
const JWT_SECRET = process.env.JWT_SECRET || "talksy_socket_secret_2026";
const TYPING_TTL_MS = 5000; // Auto-clear typing after 5s of no refresh

let io;
const userSocketMap = {};    // { userId: socketId }
const typingTimers = {};     // { `${senderId}_${receiverId}`: timeoutId }
const processedReads = {};   // { `${senderId}_${batchKey}`: timestamp } — dedup read events

// ════════════════════════════════════════════════════════════
// ─── SOCKET INITIALIZATION ───
// ════════════════════════════════════════════════════════════
export const initSocket = (server) => {
 io = new Server(server, {
  cors: {
   origin: "*",
   methods: ["GET", "POST"]
  },
  pingInterval: 25000,
  pingTimeout: 60000
 });

 // ─── JWT Authentication Middleware ───
 io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const userId = socket.handshake.query?.userId;

  // Strategy: If JWT token is provided, verify it (secure path)
  // If only userId is provided, allow it (backward compatibility)
  // This allows gradual migration without breaking existing clients
  if (token) {
   try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    return next();
   } catch (err) {
    console.log(`[Auth] Invalid JWT from socket ${socket.id}:`, err.message);
    return next(new Error("Authentication failed: Invalid token"));
   }
  }

  // Fallback: query-based userId (backward compatible)
  if (userId && userId !== "undefined") {
   socket.userId = userId;
   return next();
  }

  return next(new Error("Authentication failed: No credentials provided"));
 });

 // ════════════════════════════════════════════════════════════
 // ─── CONNECTION HANDLER ───
 // ════════════════════════════════════════════════════════════
 io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log(`[Socket] Connected: ${socket.id} | User: ${userId}`);

  // ─── Register user in socket map (with stale socket cleanup) ───
  registerUserSocket(userId, socket.id);

  // ─── Broadcast updated online users ───
  broadcastOnlineUsers();

  // ─── Deliver pending messages (batched) ───
  deliverPendingMessages(userId);

  // ════════════════════════════════════════
  // ─── TYPING EVENTS (with throttle + TTL) ───
  // ════════════════════════════════════════
  socket.on("typing_start", ({ senderId, receiverId }) => {
   // Validate: sender must be the authenticated user
   if (senderId !== userId) return;

   const timerKey = `${senderId}_${receiverId}`;

   // Forward to receiver
   emitToUser(receiverId, "typing_start", { senderId });

   // Auto-clear typing after TTL (prevents ghost indicators if client crashes)
   clearTimeout(typingTimers[timerKey]);
   typingTimers[timerKey] = setTimeout(() => {
    emitToUser(receiverId, "typing_stop", { senderId });
    delete typingTimers[timerKey];
   }, TYPING_TTL_MS);
  });

  socket.on("typing_stop", ({ senderId, receiverId }) => {
   if (senderId !== userId) return;

   const timerKey = `${senderId}_${receiverId}`;
   clearTimeout(typingTimers[timerKey]);
   delete typingTimers[timerKey];

   emitToUser(receiverId, "typing_stop", { senderId });
  });

  // ════════════════════════════════════════
  // ─── MESSAGE DELIVERY ACKNOWLEDGEMENT ───
  // ════════════════════════════════════════
  socket.on("message_delivered", async ({ messageId, senderId }) => {
   try {
    const result = await UserMessage.updateOne(
     { _id: messageId, status: "sent" },  // Only update if still "sent" (prevents double-update)
     { status: "delivered" }
    );

    // Only notify sender if we actually changed something
    if (result.modifiedCount > 0) {
     emitToUser(senderId, "message_status_update", { messageId, status: "delivered" });
    }
   } catch (err) {
    console.error("[Socket] Delivery ack error:", err.message);
   }
  });

  // ════════════════════════════════════════
  // ─── MESSAGE READ ACKNOWLEDGEMENT (with dedup) ───
  // ════════════════════════════════════════
  socket.on("message_read", async ({ messageIds, senderId }) => {
   try {
    if (!messageIds || messageIds.length === 0) return;

    // Dedup: prevent repeated read emissions for same batch
    const batchKey = messageIds.sort().join(",").slice(0, 64); // first 64 chars as key
    const dedupKey = `${userId}_${batchKey}`;
    const now = Date.now();

    if (processedReads[dedupKey] && (now - processedReads[dedupKey]) < 5000) {
     return; // Same batch processed within last 5 seconds — skip
    }
    processedReads[dedupKey] = now;

    // Bulk update — only messages not already "read"
    const result = await UserMessage.updateMany(
     { _id: { $in: messageIds }, status: { $ne: "read" } },
     { status: "read" }
    );

    // Only emit if we actually changed something
    if (result.modifiedCount > 0) {
     emitToUser(senderId, "messages_read", { messageIds, status: "read" });
    }
   } catch (err) {
    console.error("[Socket] Read ack error:", err.message);
   }
  });

  // ════════════════════════════════════════
  // ─── MESSAGE DELETION ───
  // ════════════════════════════════════════
  socket.on("delete_message", async ({ messageId, userId: requestUserId, deleteForEveryone }) => {
   try {
    if (deleteForEveryone) {
     // Soft-delete for everyone
     await UserMessage.findByIdAndUpdate(messageId, {
      isDeleted: true,
      message: "This message was deleted"
     });

     // Find the other party and notify
     const msg = await UserMessage.findById(messageId).lean();
     if (msg) {
      const otherUserId = msg.senderId.toString() === requestUserId
       ? msg.receiverId.toString()
       : msg.senderId.toString();

      emitToUser(otherUserId, "message_deleted", { messageId, deleteForEveryone: true });
     }

     // Confirm to the deleter
     socket.emit("message_deleted", { messageId, deleteForEveryone: true });
    } else {
     // Delete for me only
     await UserMessage.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: requestUserId }
     });
     socket.emit("message_deleted", { messageId, deleteForEveryone: false });
    }
   } catch (err) {
    console.error("[Socket] Delete error:", err.message);
   }
  });

  // ════════════════════════════════════════
  // ─── PROFILE UPDATE (broadcast) ───
  // ════════════════════════════════════════
  socket.on("profile_updated", (profileData) => {
   socket.broadcast.emit("profile_updated", {
    userId: profileData.userId || userId,
    name: profileData.name,
    username: profileData.username,
    profilePic: profileData.profilePic,
    about: profileData.about,
   });
  });



  // ════════════════════════════════════════
  // ─── DISCONNECT ───
  // ════════════════════════════════════════
  socket.on("disconnect", (reason) => {
   console.log(`[Socket] Disconnected: ${socket.id} | User: ${userId} | Reason: ${reason}`);

   if (userId) {
    // Only remove if this socket is still the active one (prevents race condition)
    if (userSocketMap[userId] === socket.id) {
     delete userSocketMap[userId];
     broadcastOnlineUsers();
    }

    // Cleanup any active typing timers for this user
    cleanupTypingTimers(userId);
   }
  });
 });

 // ─── Periodic cleanup of stale dedup entries (every 60s) ───
 setInterval(() => {
  const now = Date.now();
  for (const key in processedReads) {
   if (now - processedReads[key] > 30000) {
    delete processedReads[key];
   }
  }
 }, 60000);
};

// ════════════════════════════════════════════════════════════
// ─── HELPER FUNCTIONS ───
// ════════════════════════════════════════════════════════════

/**
 * Register a user's socket. If user already has an active socket,
 * force-disconnect the old one to prevent ghost connections.
 */
function registerUserSocket(userId, socketId) {
 const existingSocketId = userSocketMap[userId];
 if (existingSocketId && existingSocketId !== socketId) {
  console.log(`[Socket] Replacing stale socket for ${userId}: ${existingSocketId} → ${socketId}`);
  const oldSocket = io.sockets.sockets.get(existingSocketId);
  if (oldSocket) {
   oldSocket.disconnect(true);
  }
 }
 userSocketMap[userId] = socketId;
}

/**
 * Emit an event to a specific user (if online).
 * Returns true if the user was online and event was sent.
 */
function emitToUser(userId, event, data) {
 const socketId = userSocketMap[userId];
 if (socketId) {
  io.to(socketId).emit(event, data);
  return true;
 }
 return false;
}

/**
 * Broadcast updated online users list to all connected clients.
 */
function broadcastOnlineUsers() {
 io.emit("getOnlineUsers", Object.keys(userSocketMap));
}

/**
 * Cleanup all typing timers associated with a user (on disconnect).
 * Prevents ghost "Typing..." indicators.
 */
function cleanupTypingTimers(userId) {
 for (const key in typingTimers) {
  if (key.startsWith(`${userId}_`)) {
   // This user was typing to someone — notify them to stop
   const receiverId = key.split("_")[1];
   emitToUser(receiverId, "typing_stop", { senderId: userId });
   clearTimeout(typingTimers[key]);
   delete typingTimers[key];
  }
 }
}

/**
 * Deliver pending "sent" messages to a user who just came online.
 * Uses BATCHED emit instead of per-message emit for efficiency.
 * 500 pending messages → 1 batch emit per sender (not 500 emits).
 */
async function deliverPendingMessages(userId) {
 try {
  const pendingMessages = await UserMessage.find({
   receiverId: userId,
   status: "sent",
   isDeleted: false
  }).lean();

  if (pendingMessages.length === 0) return;

  // Bulk update all to "delivered" in one DB call
  const messageIds = pendingMessages.map(m => m._id);
  await UserMessage.updateMany(
   { _id: { $in: messageIds } },
   { status: "delivered" }
  );

  console.log(`[Socket] Delivered ${messageIds.length} pending messages for user ${userId}`);

  // Group by sender, then send ONE batch emit per sender
  const senderGroups = {};
  pendingMessages.forEach(msg => {
   const sid = msg.senderId.toString();
   if (!senderGroups[sid]) senderGroups[sid] = [];
   senderGroups[sid].push(msg._id.toString());
  });

  // Batch emit: each sender gets ONE event with ALL their message IDs
  Object.entries(senderGroups).forEach(([senderId, msgIds]) => {
   emitToUser(senderId, "bulk_message_status_update", {
    messageIds: msgIds,
    status: "delivered"
   });
  });
 } catch (err) {
  console.error("[Socket] Pending delivery error:", err.message);
 }
}

// ════════════════════════════════════════════════════════════
// ─── EXPORTS ───
// ════════════════════════════════════════════════════════════

/**
 * Generate a socket authentication token for a user.
 * Call this from login/register routes.
 */
export const generateSocketToken = (userId) => {
 return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
};

export const getReceiverSocketId = (receiverId) => {
 return userSocketMap[receiverId];
};

export { io };
