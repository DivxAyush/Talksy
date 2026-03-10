import { registerUser } from "../controllers/userController.js";

export default async function userRoutes(fastify, options) {
  fastify.post("/register", registerUser);
}