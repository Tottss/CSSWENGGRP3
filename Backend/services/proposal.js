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

    // Temporary hardcode until session integration
    const user_id = req.session.user_id || 2; // temp fallback (user account)
    const partner_org = "Partner_Account"; // reminder to fetch from session in future (user_name)

    // Upload file to S3
    const proposalId = uuidv4();
    const fileKey = `proposals/${proposalId}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    // Save metadata to DynamoDB
    const newProposal = {
      proposal_id: proposalId,
      user_id,
      partner_org,
      ProjTitle,
      ProjSummary,
      TargetBeneficiaries: Number(TargetBeneficiaries),
      AdvocacyArea,
      SDGAlignment,
      timelineStart,
      timelineEnd,
      ProposedBudget: Number(ProposedBudget),
      ProposalFile: fileUrl,
      CreatedAt: new Date().toISOString(),
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
