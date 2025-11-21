import {
    GetCommand,
    PutCommand,
    ScanCommand,
    QueryCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/dynamodb.js";
import nodemailer from "nodemailer";

export const approveProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;

        // load proposal details
        const proposalData = await docClient.send(
            new GetCommand({
                TableName: "Proposals",
                Key: { proposal_id: proposalId },
            })
        );

        if (!proposalData.Item) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        const proposal = proposalData.Item;

        // get email from session-based directory table (LoginCredentials)
        const partnerEmailData = await docClient.send(
            new QueryCommand({
                TableName: "LoginCredentials",
                IndexName: "partner_id-index",
                KeyConditionExpression: "partner_id = :pid",
                ExpressionAttributeValues: { ":pid": proposal.partner_id }
            })
        );

        const partnerEmail = partnerEmailData.Items?.[0]?.user_email;

        // automatically generate next project_id (increments)
        const scanData = await docClient.send(
            new ScanCommand({
                TableName: "Projects",
                ProjectionExpression: "project_id",
            })
        );

        const ids = scanData.Items.map((i) => Number(i.project_id));
        const nextId = ids.length ? Math.max(...ids) + 1 : 1;

        // insert merged project entry
        const projectEntry = {
            project_id: nextId,
            user_id: proposal.partner_id,

            // from proposal
            project_name: proposal.proposal_title,
            project_summary: proposal.proposal_summary,
            advocacyArea: proposal.proposal_advocacy_area,
            sdgAlignment: proposal.proposal_sdg_alignment,
            start_date: proposal.start_date,
            end_date: proposal.end_date,
            budget: Number(proposal.proposed_budget) || 0,

            project_imageURL: "/ASSETS/default_project.jpg",

            actual_beneficiaries: 0,
            target_beneficiaries: Number(proposal.num_beneficiaries) || 0,
            expenses_to_date: 0,
            progress_percent: 0,
            location: "",
            narrative: "",
            uploads: [],
            lastUpdate: "N/A",

            status: "active",
            date_created: new Date().toISOString(),
        };

        await docClient.send(
            new PutCommand({
                TableName: "Projects",
                Item: projectEntry,
            })
        );

        // send approval email
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
                subject: "Your Project Proposal Has Been Approved",
                html: `
                    <h2>Congratulations!</h2>
                    <p>Your proposal <strong>${proposal.proposal_title}</strong> has been approved.</p>
                    <p>You may now begin updating your project in the Impact Tracker.</p>
                `,
            });
        }

        // Delete proposal after approval
        await docClient.send(
            new DeleteCommand({
                TableName: "Proposals",
                Key: { proposal_id: proposalId },
            })
        );

        res.redirect("/admindashboard");
    } catch (err) {
        console.error("Error approving proposal:", err);
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};
