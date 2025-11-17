import express from "express";
import { docClient } from "../../config/dynamodb.js";
import {
    ScanCommand,
    GetCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { approveProposal } from "../admin/approveproposal.js";

const router = express.Router();
const TABLE_NAME = "Proposals";

// fetch and display all pending proposals
router.get("/list", async (req, res) => {
    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "#st = :pending",
                ExpressionAttributeNames: {
                    "#st": "status",
                },
                ExpressionAttributeValues: {
                    ":pending": "pending",
                },
            })
        );

        const proposals = result.Items || [];

        const formatted = proposals.map((p) => ({
            Submission: true,
            ProjectName: p.ProjTitle,
            Date: p.CreatedAt.split("T")[0],
            PartnerOrg: p.partner_org,
            href: `/adminproposal/${p.proposal_id}`,
        }));

        res.render("admindashboard", {
            title: "Admin Dashboard",
            PartnerOrg: req.session.user_name || "Admin",
            Proposals: formatted,
        });
    } catch (err) {
        console.error("Error loading proposals:", err);
        res.status(500).send("Failed to load proposals");
    }
});

// fetch and display specific proposal details
router.get("/:id", async (req, res) => {
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { proposal_id: req.params.id },
            })
        );

        if (!result.Item)
            return res.status(404).send("Proposal not found");

        const p = result.Item;

        res.render("adminproposal", {
            proposalId: p.proposal_id,
            orgname: p.partner_org,
            projTitle: p.ProjTitle,
            projectDesc: p.ProjSummary,
            targetValue: p.TargetBeneficiaries,
            advocacyArea: p.AdvocacyArea,
            sdgAlignment: p.SDGAlignment,
            startDate: p.timelineStart,
            endDate: p.timelineEnd,
            totalBudget: p.ProposedBudget,
            Proposalpdf: p.ProposalFile,
        });
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).send("Failed to load proposal");
    }
});

// approve a proposal
router.post("/:id/approve", approveProposal);

// decline a proposal
router.post("/:id/decline", async (req, res) => {
    try {
        await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { proposal_id: req.params.id },
                UpdateExpression: "SET #st = :declined",
                ExpressionAttributeNames: { "#st": "status" },
                ExpressionAttributeValues: { ":declined": "declined" },
            })
        );

        res.redirect("/admindashboard");
    } catch (err) {
        console.error("Decline error:", err);
        res.status(500).send("Failed to decline proposal");
    }
});

// add admin comment to a proposal
router.post("/:id/comment", async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment || comment.trim() === "")
            return res.redirect(`/adminproposal/${req.params.id}`);

        await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { proposal_id: req.params.id },
                UpdateExpression: "SET comments = list_append(if_not_exists(comments, :emptyList), :newComment)",
                ExpressionAttributeValues: {
                    ":newComment": [
                        {
                            admin: req.session.user_name,
                            message: comment,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                    ":emptyList": [],
                },
            })
        );

        res.redirect(`/adminproposal/${req.params.id}`);
    } catch (err) {
        console.error("Comment error:", err);
        res.status(500).send("Failed to submit comment");
    }
});

export default router;