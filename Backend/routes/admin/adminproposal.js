import express from "express";
import { docClient } from "../../config/dynamodb.js";
import {
    ScanCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { approveProposal } from "../admin/approveproposal.js";
import nodemailer from "nodemailer";

const router = express.Router();
const TABLE_NAME = "Proposals";

// fetch and display all pending proposals
router.get("/list", async (req, res) => {
    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "#st = :pending",
                ExpressionAttributeNames: { "#st": "status" },
                ExpressionAttributeValues: { ":pending": "pending" },
            })
        );

        const proposals = result.Items || [];

        const formatted = proposals.map((p) => ({
            Submission: true,
            ProjectName: p.proposal_title,
            Date: p.created_at?.split("T")[0] || "",
            PartnerOrg: p.partner_id,
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
            orgname: p.partner_id,
            projTitle: p.proposal_title,
            projectDesc: p.proposal_summary,
            targetValue: p.num_beneficiaries,
            advocacyArea: p.proposal_advocacy_area,
            sdgAlignment: p.proposal_sdg_alignment,
            startDate: p.start_date,
            endDate: p.end_date,
            totalBudget: p.proposed_budget,
            Proposalpdf: p.detailed_proposal,
            comments: p.admin_comments || [],
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
        const proposalId = req.params.id;

        // load proposal
        const propData = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { proposal_id: proposalId },
            })
        );

        if (!propData.Item) {
            return res.redirect("/admindashboard");
        }

        const proposal = propData.Item;

        // fetch email from LoginCredentials
        const credData = await docClient.send(
            new ScanCommand({
                TableName: "LoginCredentials",
                FilterExpression: "partner_id = :pid",
                ExpressionAttributeValues: { ":pid": proposal.partner_id },
            })
        );

        const partnerEmail = credData.Items?.[0]?.user_email || null;

        // send decline email
        if (partnerEmail) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: `"Admin" <${process.env.MAIL_USER}>`,
                to: partnerEmail,
                subject: "Your Project Proposal Has Been Declined",
                html: `
                    <h2>Proposal Declined</h2>
                    <p>We regret to inform you that your proposal 
                       <strong>${proposal.proposal_title}</strong> 
                       has been declined.</p>
                    <p>You may revise and resubmit a new proposal if you wish.</p>
                `,
            });
        }

        // delete proposal from table
        await docClient.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { proposal_id: proposalId },
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
                UpdateExpression:
                    "SET admin_comments = list_append(if_not_exists(admin_comments, :empty), :newComment)",
                ExpressionAttributeValues: {
                    ":newComment": [
                        {
                            admin: req.session.user_name || "Admin",
                            message: comment,
                            timestamp: new Date().toISOString(),
                        }
                    ],
                    ":empty": [],
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