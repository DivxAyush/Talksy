import mongoose from "mongoose";
// MONGO_URL=mongodb://talksy:Ayush2133akka%24@ac-qtkzs5w-shard-00-00.kidoizp.mongodb.net:27017,ac-qtkzs5w-shard-00-01.kidoizp.mongodb.net:27017,ac-qtkzs5w-shard-00-02.kidoizp.mongodb.net:27017/?ssl=true&replicaSet=atlas-ztqr1v-shard-0&authSource=admin&appName=GoGrocer
// PORT=5001
// JWT_SECRET=talksysecret
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;


