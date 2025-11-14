import express from "express";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const router = express.Router();

router.get("/tracker", async (req, res) => {
    try {
        const user_id = req.session.user_id;

        const data = await docClient.send(
            new ScanCommand({
                TableName: "Projects",
                FilterExpression: "#uid = :uid",
                ExpressionAttributeNames: {
                    "#uid": "user_id"
                },
                ExpressionAttributeValues: {
                    ":uid": user_id
                }
            })
        );

        const projects = data.Items || [];

        res.render("tracker", {
            Title: "Impact Tracker",
            Projects: projects,
            error: null
        });
        console.log("Loaded Projects:", projects);
    } catch (err) {
        console.error("Error loading tracker:", err);
        res.render("tracker", {
            Title: "Impact Tracker",
            Projects: [],
            error: "Failed to load tracker"
        });
    }
});

router.post("/tracker/save", async (req, res) => {
    try {
        const {
            project_id,
            actual_beneficiaries,
            target_beneficiaries,
            budget,
            expenses_to_date,
            progress_percent,
            location,
            narrative
        } = req.body;

        await docClient.send(
            new PutCommand({
                TableName: "ImpactTracker",
                Item: {
                    project_id,
                    actual_beneficiaries: Number(actual_beneficiaries),
                    target_beneficiaries: Number(target_beneficiaries),
                    budget: Number(budget),
                    expenses_to_date: Number(expenses_to_date),
                    progress_percent: Number(progress_percent),
                    location,
                    narrative
                }
            })
        );

        res.json({ success: true });

    } catch (err) {
        console.error("Error saving tracker:", err);
        res.status(500).json({ success: false });
    }
});

export default router;