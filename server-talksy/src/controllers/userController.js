import User from "../models/userModel.js";
import bcrypt from "bcrypt";

export const registerUser = async (request, reply) => {
  try {
    const { username, email, password } = request.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    return { message: "User registered successfully" };

  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
};

export const getUsers = async (request, reply) => {
  try {
    const users = await User.find().select("password email");

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