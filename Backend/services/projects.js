import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const TABLE_NAME = "Projects";

// View all projects for a specific user (partner)
export const getUserProjects = async (req, res) => {
  try {
    // TODO: replace this later with req.session.user.user_id
    const userId = req.session.user_id || 2; // temporary fallback
    console.log(req.session);
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

    console.log("Fetched projects:", projects); // log in backend not in conse

    res.render("projects", {
      Title: "Your Projects",
      BtnName: "Update Project",
      Projects: projects.map((proj) => ({
        ProjectImageURL: proj.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: proj.project_name,
      })),
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to load projects" });
  }
};
