import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/socket.js";

import userRoutes from "./src/routes/userRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

connectDB();

// ✅ CORS fix - browser clients ko allow karo
fastify.register(cors, {
  origin: true, // sab origins allow karo (dev ke liye)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.register(userRoutes, { prefix: "/api/users" });

// MESSAGE ROUTES
fastify.register(messageRoutes, { prefix: "/api/messages" });

const start = async () => {
 try {
  await fastify.listen({ port: process.env.PORT || 5000, host: "0.0.0.0" });
  initSocket(fastify.server);
  console.log("WebSocket server initialized");
 }
 catch (err) {
  fastify.log.error(err);
  process.exit(1);
 }
};

start();