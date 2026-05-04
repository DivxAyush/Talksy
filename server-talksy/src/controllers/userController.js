import MastUser from "../models/userModel.js";
import bcrypt from "bcrypt";

export const registerUser = async (request, reply) => {
 try {

  const { username, mobile, password } = request.body;

  // Validate username (no spaces, only alphanumeric, _, @)
  const usernameRegex = /^[a-zA-Z0-9_@]+$/;
  if (!usernameRegex.test(username)) {
   return reply.code(400).send({
    success: false,
    message: "Username can only contain letters, numbers, _ and @"
   });
  }

  // check existing mobile
  const existingMobile = await MastUser.findOne({ mobile });
  if (existingMobile) {
   return reply.code(400).send({
    success: false,
    message: "Mobile number already registered"
   });
  }

  // check existing username
  const existingUsername = await MastUser.findOne({ username });
  if (existingUsername) {
   return reply.code(400).send({
    success: false,
    message: "Username already taken"
   });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new MastUser({
   username,
   mobile,
   password: hashedPassword
  });

  await user.save();

  return {
   success: true,
   message: "User registered successfully",
   user: {
    _id: user._id,
    username: user.username,
    mobile: user.mobile,
    name: user.name,
    about: user.about
   }
  };

 } catch (error) {

  reply.code(500).send({
   success: false,
   message: error.message
  });

 }
};

export const getUsers = async (request, reply) => {
 try {
  const users = await MastUser.find().select("username mobile name about profilePic");

  return {
   success: true,
   users
  };

 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};

export const loginUser = async (request, reply) => {
 try {

  const { mobile, password } = request.body;

  const user = await MastUser.findOne({ mobile });

  if (!user) {
   return reply.code(400).send({
    success: false,
    message: "User not found"
   });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
   return reply.code(400).send({
    success: false,
    message: "Invalid password"
   });
  }

  return {
   success: true,
   user: {
    _id: user._id,
    username: user.username,
    mobile: user.mobile,
    name: user.name,
    about: user.about,
    profilePic: user.profilePic
   }
  };

 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};

export const updateProfile = async (request, reply) => {
 try {
  const { userId } = request.params;
  const { username, name, about, profilePic } = request.body;
 
  const updateData = { about };
  if (username !== undefined) updateData.username = username;
  if (name !== undefined) updateData.name = name;
  if (profilePic !== undefined) updateData.profilePic = profilePic;

  const user = await MastUser.findByIdAndUpdate(
   userId,
   updateData,
   { new: true }
  );

  if (!user) {
   return reply.code(404).send({
    success: false,
    message: "User not found"
   });
  }

  return {
   success: true,
   message: "Profile updated successfully",
   user: {
    _id: user._id,
    username: user.username,
    mobile: user.mobile,
    name: user.name,
    about: user.about,
    profilePic: user.profilePic
   }
  };
 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};

// ─── Save Push Notification Token ───
export const savePushToken = async (request, reply) => {
 try {
  const { userId, pushToken } = request.body;

  if (!userId || !pushToken) {
   return reply.code(400).send({
    success: false,
    message: "userId and pushToken are required"
   });
  }

  await MastUser.findByIdAndUpdate(userId, { pushToken });

  return {
   success: true,
   message: "Push token saved successfully"
  };
 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};