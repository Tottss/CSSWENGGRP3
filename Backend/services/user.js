import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";

// for testing
export const createTestUser = asyncHandler(async (req, res) => {
  const { user_name, user_email, user_password, is_admin } = req.body;

  // Check if username or email already exists
  const existingUser = await User.findOne({
    $or: [{ user_name }, { user_email }],
  });

  if (existingUser) {
    if (existingUser.user_name === user_name) {
      res.status(400).json({ message: "Username is already in use." });
    } else {
      res.status(400).json({ message: "Email is already registered." });
    }
    throw new Error("Duplicate username or email.");
  }

  // Hash password
  const hashed_password = await bcrypt.hash(user_password, 12);

  // Create new user
  const newUser = await User.create({
    user_name,
    user_email,
    hashed_password,
    is_admin,
  });

  res.status(201).json({
    message: "Test user creation successful",
    user: {
      user_id: newUser.user_id,
      user_name: newUser.user_name,
      user_email: newUser.user_email,
      is_admin: newUser.is_admin,
    },
  });
});

export const userLogIn = asyncHandler(async (req, res) => {
  const { user_email, user_password } = req.body;

  // Validate inputs
  if (!user_email || !user_password) {
    res.status(400).json({ message: "All fields must be filled." });
    throw new Error("All fields must be filled.");
  }

  // Find user by email
  const user = await User.findOne({ user_email });

  // Verify credentials
  if (!user || !(await bcrypt.compare(user_password, user.hashed_password))) {
    res.status(401).json({ message: "Invalid email or password!" });
    throw new Error("Invalid email or password!");
  }

  // Successful login
  res.status(200).json({
    message: "Login successful",
    user: {
      user_id: user.user_id,
      email: user.user_email,
      username: user.user_name,
      is_admin: user.is_admin,
    },
  });
});
