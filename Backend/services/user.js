import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// implement later
// export const userLogin = asyncHandler(async (req, res) => {}

export const userLogIn = asyncHandler(async (req, res) => {
  const { user_email, user_password } = req.body;

  // Validate inputs
  if (!user_email || !user_password) {
    res.status(400).json({ message: "All fields must be filled." });
    throw new Error("All fields must be filled.");
  }

  // Find user by email
  const user = await User.findOne({ user_email });

  if (!user || user.user_password !== user_password) {
    res.status(401).json({ message: "Invalid email or password!" });
    throw new Error("Invalid email or password!");
  }

  // Successful login
  res.status(200).json({
    message: "Login successful",
    user: {
      email: user.user_email,
      username: user.user_name,
      _id: user._id,
      is_admin: user.is_admin, // ✅ for redirect
    },
  });
});
