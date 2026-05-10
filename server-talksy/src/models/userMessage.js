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
  clientId: {
    type: String,
    default: null,
    index: true
  },
  message: {
    type: String,
    default: "",
    trim: true
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "audio", "voice"],
    default: "text"
  },
  mediaUrl: {
    type: String,
    default: ""
  },
  mediaThumbnail: {
    type: String,
    default: ""
  },
  mediaDuration: {
    type: Number,
    default: 0
  },
  mediaSize: {
    type: Number,
    default: 0
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