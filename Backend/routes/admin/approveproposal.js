import {
    GetCommand,
    PutCommand,
    ScanCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/dynamodb.js";

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

            // display photo default
            project_imageURL: "/ASSETS/default_project.jpg",

            // merged impact tracker defaults
            actual_beneficiaries: 0,
            target_beneficiaries: Number(proposal.num_beneficiaries) || 0,
            expenses_to_date: 0,
            progress_percent: 0,
            location: "",
            narrative: "",
            uploads: [],
            lastUpdate: "N/A",

            // from old projects
            status: "active",
            date_created: new Date().toISOString(),
        };

        await docClient.send(
            new PutCommand({
                TableName: "Projects",
                Item: projectEntry,
            })
        );

        // update proposal status
        await docClient.send(
            new UpdateCommand({
                TableName: "Proposals",
                Key: { proposal_id: proposalId },
                UpdateExpression: "SET #s = :approved",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: { ":approved": "approved" },
            })
        );

        res.redirect("/admindashboard");
    } catch (err) {
        console.error("Error approving proposal:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};