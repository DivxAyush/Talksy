import { getUsers, loginUser, registerUser } from "../controllers/userController.js";
import UserMessage from "../models/userMessage.js";

export default async function userRoutes(fastify, options) {
  fastify.post("/register", registerUser);
  fastify.get("/users", getUsers);
  fastify.post("/login", loginUser);
}