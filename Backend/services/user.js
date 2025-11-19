import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { docClient } from "../config/dynamodb.js";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// change USERS_TABLE from 'Users' to 'Login Credentials'
const CREDENTIALS_TABLE = "LoginCredentials";

export const userLogIn = asyncHandler(async (req, res) => {
  console.log("Received login request: ", req.body); // remove before deployment

  const { user_email, user_password } = req.body;

  // Validate inputs
  if (!user_email || !user_password) {
    res.status(400).json({ message: "All fields must be filled." });
    throw new Error("Missing login fields");
  }

  // Fetch user by email
  const result = await docClient.send(
    new GetCommand({
      TableName: CREDENTIALS_TABLE,
      Key: { user_email },
    })
  );

  const user = result.Item;

  //Verify credentials
  if (!user || !(await bcrypt.compare(user_password, user.hashed_password))) {
    res.status(401).json({ message: "INVALID CREDENTIALS!" });
    throw new Error("INVALID CREDENTIALS!");
  }

  // Securely regenerate session after successful login
  req.session.regenerate((err) => {
    if (err) {
      console.error("Session regeneration error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Set session data
    req.session.partner_id = user.partner_id;
    req.session.is_admin = user.is_admin;
    req.session.user_email = user.user_email;

    // Save session before sending response
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to save session" });
      } else {
        console.log("Session saved successfully.");
      }

      console.log("New session:", req.session);
      console.log("New sessionID:", req.sessionID);

      // send response (inside save callback!)
      res.status(200).json({
        message: "Login successful",
        user: {
          user_id: user.user_partner_id,
          email: user.user_email,
          is_admin: user.is_admin,
        },
      });
    });
  });
});
