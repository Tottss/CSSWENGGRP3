import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "../config/dynamodb.js";
import s3Client from "../config/s3Client.js";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = "Proposals";
const BUCKET_NAME = "proposals-storage";

export const showUpdateProposal = async (req, res) => {
  try {
    const proposal_id = req.session.current_proposal;
    console.log("Proposal ID: ", proposal_id); // remove after testing

    // Fetch proposal from DynamoDB
    const proposalData = await docClient.send(
      new GetCommand({
        TableName: process.env.PROPOSALS_TABLE,
        Key: { proposal_id: proposal_id },
      })
    );

    const proposal = proposalData.Item;

    // Format date to YYYY-MM-DD
    const formatDate = (dateValue) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toISOString().split("T")[0];
    };

    res.render("updateproposal", {
      DetailedProposal: proposal?.detailed_proposal || "",
      projTitle: proposal?.proposal_title || "",
      ProjSummary: proposal?.proposal_summary || "",
      TargetBeneficiaries: proposal?.num_beneficiaries || "",
      startDate: formatDate(proposal?.start_date),
      endDate: formatDate(proposal?.end_date),
      ProposedBudget: proposal?.proposed_budget || "",

      imageURL: req.session.imageURL,
    });
  } catch (err) {
    console.error("Error loading proposal:", err);
    res.status(500).send("Server error");
  }
};

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

    // partner_name, partner_type, partner_email
    const getPartnerDetails = await docClient.send(
      new GetCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        Key: {
          partner_id: Number(partner_id),
        },
      })
    );

    const partnerName =
      getPartnerDetails.Item.partner_name || "NO PARTNER_NAME SPECIFIED";

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
      partner_org: partnerName,
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
