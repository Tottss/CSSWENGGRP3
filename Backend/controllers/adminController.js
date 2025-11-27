import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showAdminDashboard = async (req, res) => {
  // for admin only
  if (!req.session.is_admin) {
    return res.status(403).send("Access denied. This is an admin only page.");
  }

  let applicants = [];
  let proposalNotifications = [];
  let updateNotifications = [];
  let combinedNotifications = [];

  try {
    // Fetch all applicants
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.APPLICANTS_TABLE,
      })
    );

    // map to the format our Handlebars template expects
    applicants = (result.Items || []).map((item) => ({
      PartnerOrg: item.partner_name,
      applicant_id: item.applicant_id,
    }));
  } catch (err) {
    console.error("Error fetching applicants:", err);
  }

  try {
    // Fetch all proposals
    const proposalResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.PROPOSALS_TABLE,
      })
    );

    // Fetch all project updates
    // Table contents: notification_id, lastUpdate, partner_name, project_id, project_name
    const updateResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.UPDATE_NOTIFICATIONS_TABLE,
      })
    );

    // map proposal notifications
    proposalNotifications = (proposalResult.Items || []).map((item) => ({
      Submission: true,
      ProjectName: item.proposal_title,
      Date: item.created_at ? item.created_at.split("T")[0] : "N/A", // extract YYYY-MM-DD
      PartnerOrg: item.partner_org || "{PARTNER_NAME HOLDER}",
      href: "/adminproposal/" + item.proposal_id,
    }));

    // map update notifications
    updateNotifications = (updateResult.Items || []).map((item) => ({
      Update: true,
      ProjectName: item.project_name,
      Date: item.lastUpdate?.split("T")[0] || "N/A",
      PartnerOrg: item.partner_name || "Unknown Partner",
      href: "/viewcommunityproject/" + item.project_id,
    }));

    combinedNotifications = [
      ...proposalNotifications,
      ...updateNotifications,
    ].sort((a, b) => new Date(b.Date) - new Date(a.Date));
  } catch (err) {
    console.error("Error fetching proposals:", err);
  }

  // Render admin dashboard
  res.render("admindashboard", {
    title: "Admin Dashboard",
    PartnerOrg: req.session.partner_name || "{Partner Org Name Holder}",
    Proposals: combinedNotifications, // change with combined notification
    Application: applicants,
    NotAdmin: req.session.is_admin ? 0 : 1,
  });
};
