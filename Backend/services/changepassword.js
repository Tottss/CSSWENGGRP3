import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { docClient } from "../config/dynamodb.js";
import {
    GetCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb";

const CREDENTIALS_TABLE = "LoginCredentials";

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const user_email = req.session.user_email;

    if (!user_email) {
        return res.status(401).json({ message: "Not logged in." });
    }

    // fetch the existing credentials
    const result = await docClient.send(
        new GetCommand({
            TableName: CREDENTIALS_TABLE,
            Key: { user_email }
        })
    );

    const user = result.Item;

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // compare old password
    const valid = await bcrypt.compare(oldPassword, user.hashed_password);

    if (!valid) {
        return res.status(401).json({ message: "Old password is incorrect." });
    }

    // hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // update DB
    await docClient.send(
        new PutCommand({
            TableName: CREDENTIALS_TABLE,
            Item: {
                ...user,
                hashed_password: newHash
            }
        })
    );

    res.status(200).json({ message: "Password updated successfully!" });
});