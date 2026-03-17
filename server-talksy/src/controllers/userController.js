import MastUser from "../models/userModel.js";
import bcrypt from "bcrypt";

export const registerUser = async (request, reply) => {
 try {

  const { username, mobile, password } = request.body;

  // check existing user
  const existingUser = await MastUser.findOne({ mobile });

  if (existingUser) {
   return reply.code(400).send({
    success: false,
    message: "Mobile number already registered"
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
    mobile: user.mobile
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
  const users = await MastUser.find().select("username password email");

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
    mobile: user.mobile
   }
  };

 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};