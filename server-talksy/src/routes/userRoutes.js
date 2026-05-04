import { getUsers, loginUser, registerUser, updateProfile, savePushToken } from "../controllers/userController.js";
import UserMessage from "../models/userMessage.js";

export default async function userRoutes(fastify, options) {
  fastify.post("/register", registerUser);
  fastify.get("/users", getUsers);
  fastify.post("/login", loginUser);
  fastify.put("/profile/:userId", updateProfile);
  fastify.post("/push-token", savePushToken);
}