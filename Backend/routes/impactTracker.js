import express from "express";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
        ExpressionAttributeValues: { ":uid": user_id },
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
          ExpressionAttributeValues: { ":pid": Number(project_id) },
        })
      );
      trackerData = trackerResp.Items?.[0] || {};
    }

    // calculate progress percent if budget and expenses are present
    let calculatedProgress = 0;
    const budget = Number(trackerData.budget || 0);
    const expense = Number(trackerData.expenses_to_date || 0);

    if (budget > 0) {
      calculatedProgress = Math.round((expense / budget) * 100);
      if (calculatedProgress > 100) calculatedProgress = 100;
      if (calculatedProgress < 0) calculatedProgress = 0;
    }

    res.render("tracker", {
      title: "Impact Tracker",
      projects,
      project_id: project_id || "",
      tracker: {
        actual_beneficiaries: trackerData.actual_beneficiaries || 0,
        target_beneficiaries: trackerData.target_beneficiaries || 0,
        budget: trackerData.budget || 0,
        expenses_to_date: trackerData.expenses_to_date || 0,
        progress_percent: calculatedProgress || 0,
        location: trackerData.location || "",
        narrative: trackerData.narrative || "",
        uploads: trackerData.uploads || [],
        lastUpdate: trackerData.lastUpdate || "N/A",
        advocacyArea: trackerData.advocacyArea || "",
        sdgAlignment: trackerData.sdgAlignment || "",
      },
      projectImage: null,
      error: null
    });

    console.log("Loaded Projects:", projects);
    console.log("Loaded Tracker Data:", trackerData);
  } catch (err) {
    console.error("Error loading tracker:", err);
    res.render("tracker", {
      title: "Impact Tracker",
      projects: [],
      error: "Failed to load tracker",
    });
  }
});

// API to get tracker data for a project
router.get("/tracker/get/:project_id", async (req, res) => {
  try {
    const project_id = Number(req.params.project_id);

    // get tracker entry
    const trackerResult = await docClient.send(
      new ScanCommand({
        TableName: "ImpactTracker",
        FilterExpression: "#pid = :pid",
        ExpressionAttributeNames: { "#pid": "project_id" },
        ExpressionAttributeValues: { ":pid": project_id },
      })
    );

    const tracker = trackerResult.Items?.[0] || {};

    // get project entry
    const projectResult = await docClient.send(
      new ScanCommand({
        TableName: "Projects",
        FilterExpression: "#pid = :pid",
        ExpressionAttributeNames: { "#pid": "project_id" },
        ExpressionAttributeValues: { ":pid": project_id },
      })
    );

    const project = projectResult.Items?.[0] || {};

    // combine and return
    return res.json({
      tracker,
      project: {
        ...project,
        displayPhoto: project.project_imageURL
      }
    });

  } catch (err) {
    console.error("Error loading tracker + project data:", err);
    return res.json({ tracker: {}, project: {} });
  }
});

// for normal uploads and display photo
const uploadTracker = upload.fields([
  { name: "uploads", maxCount: 10 },        // regular evidence/upload files
  { name: "display_photo", maxCount: 1 }    // new display photo
]);

// API to save tracker data (partial update - Option B)
router.post("/tracker/save", uploadTracker, async (req, res) => {
  try {
    const fields = req.body || {};
    const files = req.files || {};

    const projectId = Number(fields.project_id);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Missing project_id" });
    }

    // handle file uploads to S3
    let uploadedFiles = [];

    if (files.uploads && files.uploads.length > 0) {
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

        uploadedFiles.push(`https://impacttracker-uploads.s3.amazonaws.com/${key}`);
      }
    }

    // handle display photo upload separately
    let projectImageURL = null;
    if (files.display_photo && files.display_photo.length > 0) {
      const file = files.display_photo[0];
      const key = `images/${Date.now()}-${file.originalname}`;

      // upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: "proposals-storage",
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      projectImageURL = `https://proposals-storage.s3.amazonaws.com/${key}`;

      // update only project_imageURL on Projects
      await docClient.send(
        new UpdateCommand({
          TableName: "Projects",
          Key: { project_id: projectId },
          UpdateExpression: "SET #img = :img",
          ExpressionAttributeNames: { "#img": "project_imageURL" },
          ExpressionAttributeValues: { ":img": projectImageURL },
          ReturnValues: "UPDATED_NEW",
        })
      );
    }

    // fetch existing tracker to merge uploads
    const existingTrackerResp = await docClient.send(
      new ScanCommand({
        TableName: "ImpactTracker",
        FilterExpression: "#pid = :pid",
        ExpressionAttributeNames: { "#pid": "project_id" },
        ExpressionAttributeValues: { ":pid": projectId },
      })
    );
    const existingTracker = existingTrackerResp.Items?.[0] || {};

    // merge uploads (append new ones to existing array)
    const mergedUploads = Array.isArray(existingTracker.uploads)
      ? existingTracker.uploads.concat(uploadedFiles)
      : uploadedFiles;

    // update tracker entry
    // only update fields that are provided (non-empty)
    const updateParts = [];
    const exprNames = {};
    const exprValues = {};

    function addUpdate(name, attrName, value, asNumber = false) {
      if (value === undefined || value === null || value === "") return;
      const placeholder = `:${name}`;
      const pname = `#${name}`;
      exprNames[pname] = attrName;
      exprValues[placeholder] = asNumber ? Number(value) : value;
      updateParts.push(`${pname} = ${placeholder}`);
    }

    addUpdate("actual", "actual_beneficiaries", fields.actual_beneficiaries, true);
    addUpdate("target", "target_beneficiaries", fields.target_beneficiaries, true);
    addUpdate("budget", "budget", fields.budget, true);
    addUpdate("expenses", "expenses_to_date", fields.expenses_to_date, true);
    // compute progress_percent if budget or expenses changed
    if (fields.budget !== undefined || fields.expenses_to_date !== undefined) {
      const b = Number(fields.budget || existingTracker.budget || 0);
      const e = Number(fields.expires_to_date || fields.expenses_to_date || existingTracker.expenses_to_date || 0);
      let computedProgress = 0;
      if (b > 0) {
        computedProgress = Math.round((e / b) * 100);
        if (computedProgress < 0) computedProgress = 0;
        if (computedProgress > 100) computedProgress = 100;
      }
      exprNames["#progress_percent"] = "progress_percent";
      exprValues[":progress_percent"] = computedProgress;
      updateParts.push(`#progress_percent = :progress_percent`);
    }

    addUpdate("location", "location", fields.location, false);
    addUpdate("narrative", "narrative", fields.narrative, false);

    // always update uploads (even if empty array) to reflect mergedUploads if there are any new uploads
    if (mergedUploads.length > 0) {
      exprNames["#uploads"] = "uploads";
      exprValues[":uploadsVal"] = mergedUploads;
      updateParts.push(`#uploads = :uploadsVal`);
    }

    // always update lastUpdate
    exprNames["#lastUpdate"] = "lastUpdate";
    exprValues[":lastUpdateVal"] = new Date().toISOString();
    updateParts.push(`#lastUpdate = :lastUpdateVal`);

    // If no update parts (user sent nothing meaningful), respond success (no-op)
    if (updateParts.length === 0) {
      return res.json({ success: true, project_imageURL });
    }

    const updateExpression = "SET " + updateParts.join(", ");

    // execute the update for ImpactTracker
    await docClient.send(
      new UpdateCommand({
        TableName: "ImpactTracker",
        Key: { project_id: projectId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: "UPDATED_NEW",
      })
    );

    return res.json({
      success: true,
      project_imageURL: projectImageURL,
    });

  } catch (err) {
    console.error("Error saving tracker:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;