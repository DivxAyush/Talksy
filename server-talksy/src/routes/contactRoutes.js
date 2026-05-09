import { checkContacts } from "../controllers/contactController.js";

export default async function contactRoutes(fastify, options) {
 // Check which phone contacts are registered on Talksy
 fastify.post("/check", checkContacts);
}
