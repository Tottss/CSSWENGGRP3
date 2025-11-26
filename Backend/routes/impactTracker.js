import express from "express";
import {
  ScanCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// load tracker view
router.get("/tracker", async (req, res) => {
  try {
    const user_id = req.session.partner_id;

    const data = await docClient.send(
      new ScanCommand({
        TableName: process.env.PROJECTS_TABLE,
        FilterExpression: "#uid = :uid",
        ExpressionAttributeNames: { "#uid": "user_id" },
        ExpressionAttributeValues: { ":uid": user_id },
      })
    );

    const projects = data.Items || [];

    let project_id = req.query.project_id;
    let trackerData = {};

    if (project_id) {
      const resp = await docClient.send(
        new GetCommand({
          TableName: process.env.PROJECTS_TABLE,
          Key: { project_id: Number(project_id) },
        })
      );
      trackerData = resp.Item || {};
    }

    res.render("tracker", {
      title: "Impact Tracker",
      projects,
      lastUpdate: trackerData.lastUpdate || "N/A",

      // auto-fill fields
      actual_beneficiaries: trackerData.actual_beneficiaries || 0,
      target_beneficiaries: trackerData.target_beneficiaries || 0,

      budget: trackerData.budget || 0,
      expense: trackerData.expenses_to_date || 0,

      progress: trackerData.progress_percent || 0,
      advocacyArea: trackerData.advocacyArea || "",
      sdgAlignment: trackerData.sdgAlignment || "",
      communityLocation: trackerData.location || "",
      narrative: trackerData.narrative || "",

      uploads: trackerData.uploads || [],
      imageURL: req.session.imageURL,
    });
  } catch (err) {
    console.error("Error loading tracker:", err);
    res.render("tracker", {
      title: "Impact Tracker",
      projects: [],
      error: "Failed to load tracker",
    });
  }
});

// fetch project + tracker data
router.get("/tracker/get/:project_id", async (req, res) => {
  try {
    const project_id = Number(req.params.project_id);

    const projectResp = await docClient.send(
      new GetCommand({
        TableName: process.env.PROJECTS_TABLE,
        Key: { project_id },
      })
    );

    const project = projectResp.Item || {};

    return res.json({
      tracker: project,
      project,
    });
  } catch (err) {
    console.error("Error loading tracker data:", err);
    return res.json({ tracker: {}, project: {} });
  }
});

// for normal uploads and display photo
const uploadTracker = upload.fields([
  { name: "uploads", maxCount: 10 },
  { name: "display_photo", maxCount: 1 },
]);

// save tracker data into Projects
router.post("/tracker/save", uploadTracker, async (req, res) => {
  try {
    const fields = req.body;
    const files = req.files;

    const projectId = Number(fields.project_id);

    let uploadedFiles = [];

    // upload evidence
    if (files.uploads) {
      for (const file of files.uploads) {
        const key = `tracker/${Date.now()}-${file.originalname}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: "impacttracker-uploads",
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        uploadedFiles.push(
          `https://impacttracker-uploads.s3.amazonaws.com/${key}`
        );
      }
    }

    // upload display photo
    let projectImageURL = null;
    if (files.display_photo) {
      const file = files.display_photo[0];
      const key = `images/${Date.now()}-${file.originalname}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: "proposals-storage",
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      projectImageURL = `https://proposals-storage.s3.amazonaws.com/${key}`;
    }

    // load existing project
    const current = await docClient.send(
      new GetCommand({
        TableName: process.env.PROJECTS_TABLE,
        Key: { project_id: projectId },
      })
    );

    const prev = current.Item || {};
    const mergedUploads = (prev.uploads || []).concat(uploadedFiles);

    // compute progress percent
    const budget = Number(fields.budget || prev.budget || 0);
    const expense = Number(
      fields.expenses_to_date || prev.expenses_to_date || 0
    );

    let computedProgress = 0;
    if (budget > 0) {
      computedProgress = Math.min(
        100,
        Math.max(0, Math.round((expense / budget) * 100))
      );
    }

    // update project in DB
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.PROJECTS_TABLE,
        Key: { project_id: projectId },
        UpdateExpression: `
      SET actual_beneficiaries = :actual,
          target_beneficiaries = :target,
          budget = :budget,
          expenses_to_date = :exp,
          progress_percent = :prog,
          #location = :loc,
          narrative = :nar,
          uploads = :uploads,
          lastUpdate = :lu
          ${projectImageURL ? ", project_imageURL = :img" : ""}
    `,
        ExpressionAttributeNames: {
          "#location": "location",
        },
        ExpressionAttributeValues: {
          ":actual": Number(fields.actual_beneficiaries) || 0,
          ":target": Number(fields.target_beneficiaries) || 0,
          ":budget": budget,
          ":exp": expense,
          ":prog": computedProgress,
          ":loc": fields.location || "",
          ":nar": fields.narrative || "",
          ":uploads": mergedUploads,
          ":lu": new Date().toISOString(),
          ...(projectImageURL ? { ":img": projectImageURL } : {}),
        },
      })
    );

    // START TEST - NEW
    const partnerOrg = await docClient.send(
      new GetCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        Key: { partner_id: prev.user_id },
      })
    );

    const partnerOwnerName = partnerOrg.Item?.partner_name || "Unknown Partner";

    const sendUpdateToAdmin = await docClient.send(
      new PutCommand({
        TableName: process.env.UPDATE_NOTIFICATIONS_TABLE,
        Item: {
          notification_id: Date.now(), // unique ID
          partner_name: partnerOwnerName, // name from partner org table
          project_id: projectId, // current project
          lastUpdate: new Date().toISOString(), // when tracker was updated
          project_name: prev.project_name, // include project name
        },
      })
    );

    if (sendUpdateToAdmin) {
      console.log("ADMIN NOTIFIED BY THE UPDATE!");
    }
    // END TEST - NEW

    res.json({ success: true, project_imageURL: projectImageURL || undefined });
  } catch (err) {
    console.error("Error saving tracker:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
