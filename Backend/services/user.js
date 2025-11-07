import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { docClient } from "../config/dynamodb.js";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const USERS_TABLE = "Users";
// add other tables here

// Create a test user (POST /user/createTestUser)
export const createTestUser = asyncHandler(async (req, res) => {
  const { user_name, user_email, user_password, is_admin } = req.body;

  if (!user_name || !user_email || !user_password) {
    res.status(400).json({ message: "All fields are required." });
    throw new Error("Missing fields");
  }

  // Check if email already exists
  const existingUser = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { user_email },
    })
  );

  if (existingUser.Item) {
    res.status(400).json({ message: "Email is already registered." });
    throw new Error("Duplicate email.");
  }

  // Optional: Check if username already exists (requires a Scan)
  const usernameCheck = await docClient.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "#un = :uname",
      ExpressionAttributeNames: { "#un": "user_name" },
      ExpressionAttributeValues: { ":uname": user_name },
    })
  );

  if (usernameCheck.Count > 0) {
    res.status(400).json({ message: "Username is already in use." });
    throw new Error("Duplicate username.");
  }

  // Hash password
  const hashed_password = await bcrypt.hash(user_password, 12);

  // Create new user
  const newUser = {
    user_email,
    user_name,
    hashed_password,
    is_admin: !!is_admin,
    user_id: Date.now(), // simple unique ID
  };

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: newUser,
    })
  );

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

// User Login (POST /user/login)
export const userLogIn = asyncHandler(async (req, res) => {
  console.log("Received login request:", req.body);

  const { user_email, user_password } = req.body;

  // Validate inputs
  if (!user_email || !user_password) {
    res.status(400).json({ message: "All fields must be filled." });
    throw new Error("Missing login fields");
  }

  // Fetch user by email
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { user_email },
    })
  );

  const user = result.Item;

  // Verify credentials
  if (!user || !(await bcrypt.compare(user_password, user.hashed_password))) {
    res.status(401).json({ message: "INVALID CREDENTIALS!" });
    throw new Error("INVALID CREDENTIALS!");
  }

  // securely regenerate session after login
  req.session.regenerate((err) => {
    if (err) {
      console.error("Session regeneration error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Set session data
    req.session.user_id = user.user_id;
    req.session.is_admin = user.is_admin;
    req.session.user_email = user.user_email;

    // remove after testing
    console.log("New session:", req.session);
    console.log("New sessionID:", req.sessionID);

    // Send response *inside* the callback
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
});
