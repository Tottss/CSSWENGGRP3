import express from "express";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import multer from "multer";
import s3Client from "../config/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/tracker", async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const project_id = req.query.project_id;

        // load user projects
        const data = await docClient.send(
            new ScanCommand({
                TableName: "Projects",
                FilterExpression: "#uid = :uid",
                ExpressionAttributeNames: { "#uid": "user_id" },
                ExpressionAttributeValues: { ":uid": user_id }
            })
        );
        const projects = data.Items || [];

        // load existing tracker data if project_id is provided
        let trackerData = {};
        if (project_id) {
            const trackerResp = await docClient.send(
                new ScanCommand({
                    TableName: "ImpactTracker",
                    FilterExpression: "#pid = :pid",
                    ExpressionAttributeNames: { "#pid": "project_id" },
                    ExpressionAttributeValues: { ":pid": Number(project_id) }
                })
            );
            trackerData = trackerResp.Items?.[0] || {};
        }

        res.render("tracker", {
            title: "Impact Tracker",
            projects,
            project_id: project_id || "",
            actual: trackerData.actual_beneficiaries || 0,
            target: trackerData.target_beneficiaries || 0,
            budget: trackerData.budget || 0,
            expense: trackerData.expenses_to_date || 0,
            progress: trackerData.progress_percent || 0,
            location: trackerData.communityLocation || "",
            narrative: trackerData.narrative || "",
            uploads: trackerData.uploads || [],
            lastUpdate: trackerData.lastUpdate || "N/A",
            advocacyArea: trackerData.advocacyArea || "",
            sdgAlignment: trackerData.sdgAlignment || "",
            error: null
        });

        console.log("Loaded Projects:", projects);
        console.log("Loaded Tracker Data:", trackerData);
    } catch (err) {
        console.error("Error loading tracker:", err);
        res.render("tracker", {
            title: "Impact Tracker",
            projects: [],
            error: "Failed to load tracker"
        });
    }
});

// API to get tracker data for a project
router.get("/tracker/get/:project_id", async (req, res) => {
    try {
        const project_id = Number(req.params.project_id);

        const result = await docClient.send(
            new ScanCommand({
                TableName: "ImpactTracker",
                FilterExpression: "#pid = :pid",
                ExpressionAttributeNames: { "#pid": "project_id" },
                ExpressionAttributeValues: { ":pid": project_id }
            })
        );

        return res.json(result.Items?.[0] || {});
    } catch (err) {
        console.error("Error loading tracker data:", err);
        return res.json({});
    }
});

router.post("/tracker/save", upload.array("uploads"), async (req, res) => {
    try {
        const fields = req.body;
        const files = req.files || [];

        let uploadedFiles = [];

        // upload files to S3
        for (const file of files) {
            const fileKey = `tracker/${Date.now()}-${file.originalname}`;

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: "impacttracker-uploads",
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            uploadedFiles.push(`https://impacttracker-uploads.s3.amazonaws.com/${fileKey}`);
        }

        // save/update tracker in DynamoDB
        await docClient.send(
            new PutCommand({
                TableName: "ImpactTracker",
                Item: {
                    project_id: Number(fields.project_id),
                    actual_beneficiaries: Number(fields.actual_beneficiaries),
                    target_beneficiaries: Number(fields.target_beneficiaries),
                    budget: Number(fields.budget),
                    expenses_to_date: Number(fields.expenses_to_date),
                    progress_percent: Number(fields.progress_percent),
                    location: fields.location,
                    narrative: fields.narrative,
                    uploads: uploadedFiles
                }
            })
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("Error saving tracker:", err);
        return res.status(500).json({ success: false });
    }
});

export default router;
