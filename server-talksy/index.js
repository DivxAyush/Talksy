require("dotenv").config()
const fastify = require("fastify")({ logger: true })
const mongoose = require("mongoose")

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => console.log(err))

fastify.get("/", async () => {
  return { message: "Talksy server running 🚀" }
})

const start = async () => {
  try {
    await fastify.listen({ port: 5000, host: "0.0.0.0" })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()