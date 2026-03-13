import mongoose from "mongoose";

const userMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    required: true,
     trim: true
  }
}, { timestamps: true });

export default mongoose.model("UserMessage", userMessageSchema);