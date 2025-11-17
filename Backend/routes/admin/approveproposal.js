import {
    GetCommand,
    PutCommand,
    UpdateCommand,
    ScanCommand,
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

        // clean numeric fields
        const parsedBeneficiaries =
            Number(proposal.TargetBeneficiaries) || 0;
        const parsedBudget = Number(proposal.ProposedBudget) || 0;

        // inserts to projects table
        const projectEntry = {
            project_id: nextId,
            user_id: proposal.user_id,

            project_name: proposal.ProjTitle,
            project_summary: proposal.ProjSummary,

            project_imageURL:
                proposal.project_imageURL || "/ASSETS/border-design.png",

            date_created: new Date().toISOString(),
            status: "active",

            // from proposal
            advocacyArea: proposal.AdvocacyArea || "",
            sdgAlignment: proposal.SDGAlignment || "",
        };

        await docClient.send(
            new PutCommand({
                TableName: "Projects",
                Item: projectEntry,
            })
        );

        // creates initial tracker entry
        const trackerEntry = {
            project_id: nextId,

            // starting values
            actual_beneficiaries: 0,
            target_beneficiaries: parsedBeneficiaries,
            budget: parsedBudget,
            expenses_to_date: 0,
            progress_percent: 0,

            // narrative + location
            narrative: proposal.narrative || "",
            location: proposal.location || "",

            uploads: [],
            lastUpdate: "N/A",

            advocacyArea: proposal.AdvocacyArea || "",
            sdgAlignment: proposal.SDGAlignment || "",
        };

        await docClient.send(
            new PutCommand({
                TableName: "ImpactTracker",
                Item: trackerEntry,
            })
        );

        // update proposal status to approved
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
        return res
            .status(500)
            .json({ message: "Internal server error", error: err.message });
    }
};