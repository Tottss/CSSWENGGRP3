import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

// View all projects for a specific user (partner)
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.session.partner_id; // fixed
    console.log(req.session);
    const data = await docClient.send(
      new ScanCommand({
        TableName: process.env.PROJECTS_TABLE,
        FilterExpression: "user_id = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    const projects = data.Items || [];

    res.render("projects", {
      Title: "Your Projects",
      BtnName: "View Project",
      Projects: projects.map((proj) => ({
        ProjectImageURL: proj.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: proj.project_name,
        ProjectID: proj.project_id,
      })),
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to load projects" });
  }
};
