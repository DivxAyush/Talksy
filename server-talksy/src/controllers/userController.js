import MastUser from "../models/userModel.js";
import bcrypt from "bcrypt";

export const registerUser = async (request, reply) => {
 try {

  const { username, mobile, password } = request.body;

  // check existing user
  const existingUser = await MastUser.findOne({ mobile }); MastUser

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
   message: "User registered successfully"
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