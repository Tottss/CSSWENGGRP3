import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

// View all projects for a specific user (partner)
export const getUserProjects = async (req, res) => {
  try {
    // check if user is admin, redirect to delete page
    if (req.session.is_admin === true) {
      return res.redirect("/deleteprojects");
    }

    const userId = req.session.partner_id; // fixed
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

    // remove when imageurl is consistent thru sessions
    const partnerData = await docClient.send(
      new ScanCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        FilterExpression: "partner_id = :uid",
        ExpressionAttributeValues: { ":uid": Number(userId) },
      })
    );

    const partner = partnerData.Items;

    res.render("projects", {
      Title: "Your Projects",
      BtnName: "View Project",
      Projects: projects.map((proj) => ({
        ProjectImageURL: proj.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: proj.project_name,
        ProjectID: proj.project_id,
      })),
      NotAdmin: req.session.is_admin ? 0 : 1,
      imageURL:
        partner[0].profile_picture ||
        "https://bcf-profile-pictures.s3.ap-southeast-1.amazonaws.com/DefaultProfile.jpg",
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to load projects" });
  }
};
