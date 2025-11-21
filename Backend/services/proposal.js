import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "../config/dynamodb.js";
import s3Client from "../config/s3Client.js";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = "Proposals";
const BUCKET_NAME = "proposals-storage";

export const createProposal = async (req, res) => {
  try {
    const {
      ProjTitle,
      ProjSummary,
      TargetBeneficiaries,
      AdvocacyArea,
      SDGAlignment,
      timelineStart,
      timelineEnd,
      ProposedBudget,
    } = req.body;

    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const partner_id = req.session.partner_id;

    if (!partner_id) {
      return res.status(401).json({ message: "User not logged in." });
    }

    // Upload file to S3
    const proposal_id = uuidv4();
    const fileKey = `proposals/${proposal_id}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    const newProposal = {
      proposal_id,
      partner_id,

      proposal_title: ProjTitle,
      proposal_summary: ProjSummary,
      num_beneficiaries: Number(TargetBeneficiaries),
      proposal_advocacy_area: AdvocacyArea,
      proposal_sdg_alignment: SDGAlignment,

      start_date: timelineStart,
      end_date: timelineEnd,

      proposed_budget: Number(ProposedBudget),
      detailed_proposal: fileUrl,

      admin_comments: [],

      created_at: new Date().toISOString(),
      status: "pending",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newProposal,
      })
    );

    res.status(201).json({
      message: "Proposal submitted successfully",
      proposal: newProposal,
    });
  } catch (err) {
    console.error("Error saving proposal:", err);
    res.status(500).json({
      message: "Failed to save proposal",
      error: err.message,
    });
  }
};
