// controllers/projectController.js
import {
  UpdateCommand,
  PutCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showViewProject = async (req, res) => {
  res.render("viewProject", {
    projtitle: "Project Title Here",
    ImageURL: "/ASSETS/border-design.png",
    ProjectDesc: "This is a project to help the project is a project to help",
    totalBudget: "1298127",
    expenses: "19021829",
    actualValue: "0",
    targetValue: "200",
    advocacyarea: "Poverty",
    sdgalignment: "1,2,3",
    communitylocation: "12281",
  });
};

export const showCommunityProjects = async (req, res) => {
  try {
    // Fetch ALL accepted projects from the Projects table
    const data = await docClient.send(
      new ScanCommand({
        TableName: "Projects",
      })
    );

    const projects = data.Items || [];

    res.render("projects", {
      Title: "Community Projects",
      BtnName: "View Project",
      Projects: projects.map((p) => ({
        ProjectImageURL: p.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),
    });
  } catch (err) {
    console.error("Error loading community projects:", err);
    res.status(500).render("error", {
      message: "Failed to load community projects.",
    });
  }
};
