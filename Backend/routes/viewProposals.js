import express from "express";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const router = express.Router();
const TABLE = "Proposals";

// render list of proposals (filters, only pending, proposals associated to current user)
router.get("/viewproposal-list", async (req, res) => {
    try {
        const userId = req.session.partner_id;

        if (!userId) {
            return res.redirect("/login");
        }

        // query only pending proposals for the user
        const result = await docClient.send(
            new QueryCommand({
                TableName: TABLE,
                IndexName: "user_id-status-index",
                KeyConditionExpression: "#uid = :uid AND #st = :pending",
                ExpressionAttributeNames: {
                    "#uid": "user_id",
                    "#st": "status"
                },
                ExpressionAttributeValues: {
                    ":uid": userId,
                    ":pending": "pending"
                }
            })
        );

        // map results to proposal list format
        const proposals = (result.Items || []).map((p) => ({
            ProjectName: p.ProjTitle,
            Date: p.CreatedAt ? p.CreatedAt.split("T")[0] : "",
            href: `/viewproposal/${encodeURIComponent(p.proposal_id)}`,
            proposal_id: p.proposal_id,
            partner_org: p.partner_org || p.user_id || "Unknown",
            status: p.status || "unknown",
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
        const id = req.params.id;
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE,
                Key: { proposal_id: id },
            })
        );

        if (!result.Item) return res.status(404).send("Proposal not found");

        const p = result.Item;

        const comments = Array.isArray(p.comments) ? p.comments : [];

        res.render("viewproposal", {
            projTitle: p.ProjTitle,
            projSummary: p.ProjSummary,
            targetValue: p.TargetBeneficiaries,
            advoacyArea: p.AdvocacyArea,
            SDG: p.SDGAlignment || p.SDG || "",
            startDate: p.timelineStart,
            endDate: p.timelineEnd,
            proposedBudget: p.ProposedBudget,
            detailedProposal: p.ProposalFile,
            proposal_id: p.proposal_id,
            partner_org: p.partner_org || p.user_id,
            comments,
            status: p.status || "pending",
        });
    } catch (err) {
        console.error("Error loading proposal:", err);
        res.status(500).send("Failed to load proposal");
    }
});

export default router;