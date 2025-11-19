import {
  UpdateCommand,
  PutCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const userDashboard = async (req, res) => {
  try {
    const userId = req.session.partner_id;

    if (!userId) {
      throw alert("UserId uninitialized");
    }

    console.log("Session id (for debugging): ", req.session.id); // remove after testing
    console.log("Session User Id:", req.session.partner_id); // remove after testing

    // Fetch all projects (for Community Projects)
    const allProjectsData = await docClient.send(
      new ScanCommand({
        TableName: "Projects",
        // Gets all projects from all users
      })
    );

    // Fetch partner’s own projects (currently logged in partner) **hardcoded user for now**
    const yourProjectsData = await docClient.send(
      new ScanCommand({
        TableName: "Projects",
        FilterExpression: "user_id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );

    const communityProjects = allProjectsData.Items || [];
    const yourProjects = yourProjectsData.Items || [];

    const partnerData = await docClient.send(
      new ScanCommand({
        TableName: "PartnerOrg",
        FilterExpression: "partner_id = :uid",
        ExpressionAttributeValues: { ":uid": Number(userId) },
      })
    );

    const data = partnerData.Items;

    res.render("dashboard", {
      title: "Dashboard",
      PartnerOrg: data[0].partner_name || "Partner Org Name",
      nNotif: 1,
      showTools: true,

      // test image urls
      // Community Projects
      CommunityProjects: communityProjects.map((p) => ({
        ProjectImageURL: p.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),

      // Your Projects
      YourProjects: yourProjects.map((p) => ({
        ProjectImageURL: p.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Failed to load dashboard");
  }
};
