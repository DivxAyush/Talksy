import { getUsers, registerUser } from "../controllers/userController.js";

export default async function userRoutes(fastify, options) {
  fastify.post("/register", registerUser);

  fastify.get("/users", getUsers);
  fastify.post("/login", loginUser);
}