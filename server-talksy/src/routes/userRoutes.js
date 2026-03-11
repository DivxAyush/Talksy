import { getUsers, registerUser } from "../controllers/userController.js";

export default async function userRoutes(fastify, options) {
  fastify.post("/register", registerUser);
    // Get all users
  fastify.get("/users", getUsers);
}