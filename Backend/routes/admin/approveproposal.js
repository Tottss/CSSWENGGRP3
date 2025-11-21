import {
    GetCommand,
    PutCommand,
    UpdateCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/dynamodb.js";

const PROJECTS_TABLE = "Projects";
const PROPOSALS_TABLE = "Proposals";

export const approveProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;

        // load proposal details
        const proposalData = await docClient.send(
            new GetCommand({
                TableName: PROPOSALS_TABLE,
                Key: { proposal_id: proposalId },
            })
        );

        if (!proposalData.Item) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        const p = proposalData.Item;

        // automatically generate next project_id (increments)
        const scanData = await docClient.send(
            new ScanCommand({
                TableName: PROJECTS_TABLE,
                ProjectionExpression: "project_id",
            })
        );

        const ids = scanData.Items.map(i => Number(i.project_id));
        const nextId = ids.length ? Math.max(...ids) + 1 : 1;

        // inserts to projects table
        const projectEntry = {
            project_id: nextId,
            partner_id: p.partner_id,
            project_title: p.proposal_title,
            project_summary: p.proposal_summary,
            project_advocacy_area: p.proposal_advocacy_area,
            project_sdg_alignment: p.proposal_sdg_alignment,

            // tracking fields
            actual_beneficiaries: 0,
            target_beneficiaries: Number(p.num_beneficiaries) || 0,
            project_budget: Number(p.proposed_budget) || 0,
            expenses_to_date: 0,

            // project metadata
            project_status: "active",
            start_date: p.start_date,
            end_date: p.end_date,
            project_imageURL: p.project_imageURL || "/ASSETS/border-design.png",
            created_at: new Date().toISOString(),
        };

        await docClient.send(
            new PutCommand({
                TableName: PROJECTS_TABLE,
                Item: projectEntry,
            })
        );

        // update proposal status to approved
        await docClient.send(
            new UpdateCommand({
                TableName: PROPOSALS_TABLE,
                Key: { proposal_id: proposalId },
                UpdateExpression: "SET #s = :approved",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: { ":approved": "approved" },
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