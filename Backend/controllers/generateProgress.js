import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showGenProg = async (req, res) => {
  try {
    const userId = req.session.partner_id;

    const data = await docClient.send(
      new ScanCommand({
        TableName: process.env.PROJECTS_TABLE,
        FilterExpression: "user_id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );

    const projects = data.Items || [];

    res.render("generateProgress", {
      projects: projects.map((p) => ({
        project_id: p.project_id,
        project_name: p.project_name,
      })),
    });
  } catch (err) {
    console.error("Error loading projects for progress generation:", err);
    res.status(500).send("Failed to load available projects");
  }
};
