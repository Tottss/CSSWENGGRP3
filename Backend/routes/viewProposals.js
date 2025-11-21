import express from "express";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const router = express.Router();
const TABLE = "Proposals";

// render list of proposals (filters, only pending, proposals associated to current user)
router.get("/viewproposal-list", async (req, res) => {
  try {
    const partnerId = req.session.partner_id;

    if (!partnerId) {
      return res.redirect("/login");
    }

    // query only pending proposals for the user
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "partner_id-status-index",
        KeyConditionExpression: "#pid = :pid AND #st = :pending",
        ExpressionAttributeNames: {
          "#pid": "partner_id",
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":pid": partnerId,
          ":pending": "pending",
        },
      })
    );

    // map results to proposal list format
    const proposals = (result.Items || []).map((p) => ({
      ProjectName: p.proposal_title,
      Date: p.created_at ? p.created_at.split("T")[0] : "",
      href: `/viewproposal/${p.proposal_id}`,
      proposal_id: p.proposal_id,
      status: p.status,
    }));

    res.render("viewproposal-list", { Proposals: proposals });
  } catch (err) {
    console.error("Error loading proposal list:", err);
    res.status(500).send("Failed to load proposals");
  }
});

// show one proposal by id
router.get("/viewproposal/:id", async (req, res) => {
  try {
    const proposalId = req.params.id;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE,
        Key: { proposal_id: proposalId },
      })
    );

    if (!result.Item) {
      return res.status(404).send("Proposal not found");
    }

    const p = result.Item;

    res.render("viewproposal", {
      proposal_id: p.proposal_id,
      partner_id: p.partner_id,
      projTitle: p.proposal_title,
      projSummary: p.proposal_summary,
      targetValue: p.num_beneficiaries,
      advocacyArea: p.proposal_advocacy_area,
      SDG: p.proposal_sdg_alignment,
      startDate: p.start_date,
      endDate: p.end_date,
      proposedBudget: p.proposed_budget,
      detailedProposal: p.detailed_proposal,
      comments: p.admin_comments || [],
      status: p.status,
    });
  } catch (err) {
    console.error("Error loading proposal:", err);
    res.status(500).send("Failed to load proposal");
  }
});

export default router;