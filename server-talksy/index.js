import Fastify from "fastify";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

import userRoutes from "./src/routes/userRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

connectDB();

fastify.register(userRoutes, { prefix: "/api/users" });

// MESSAGE ROUTES
fastify.register(messageRoutes, { prefix: "/api/messages" });

const start = async () => {
 try {
  await fastify.listen({ port: process.env.PORT || 5000, host: "0.0.0.0" });
 }
 catch (err) {
  fastify.log.error(err);
  process.exit(1);
 }
};

start();