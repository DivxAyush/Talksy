import Fastify from "fastify";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

connectDB();

fastify.register(userRoutes, { prefix: "/api/users" });

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