import Fastify from "fastify";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

connectDB();

fastify.register(userRoutes, { prefix: "/api/users" });

const start = async () => {
  await fastify.listen({ port: 5000 });
};

start();