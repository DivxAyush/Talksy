import mongoose from "mongoose";

const userMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MastUser",
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MastUser",
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserMessage",
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "MastUser"
  }]
}, { timestamps: true });

// Compound index for efficient conversation queries
userMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// Index for unread count queries
userMessageSchema.index({ receiverId: 1, status: 1 });

export default mongoose.model("UserMessage", userMessageSchema);