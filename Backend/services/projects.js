import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const TABLE_NAME = "Projects";

// View all projects for a specific user (partner)
export const getUserProjects = async (req, res) => {
    try {
        // TODO: replace this later with req.session.user.user_id
        const userId = 2; // temporary

        const data = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "user_id = :uid",
                ExpressionAttributeValues: {
                ":uid": userId,
                },
            })
        );

        const projects = data.Items || [];

        res.render("projects", {
            Title: "Your Projects",
            BtnName: "Update Project",
            Projects: projects.map((proj) => ({
                ProjectImageURL: proj.ProjectImageURL || "/ASSETS/border-design.png",
                ProjectName: proj.project_name,
            })),
        });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ message: "Failed to load projects" });
    }
};