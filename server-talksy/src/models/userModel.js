import mongoose from "mongoose";

const mastUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    default: ""
  },
  about: {
    type: String,
    default: "Hey there! I am using Talksy."
  },
  profilePic: {
    type: String,
    default: ""
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model("MastUser", mastUserSchema);