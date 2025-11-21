import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showAdminDashboard = async (req, res) => {
  // for admin only
  if (!req.session.is_admin) {
    return res.status(403).send("Access denied. This is an admin only page.");
  }

  const APPLICANTS_TABLE = "Applicants";
  const PROPOSALS_TABLE = "Proposals";

  let applicants = [];
  let proposalNotifications = [];

  try {
    // Fetch all applicants
    const result = await docClient.send(
      new ScanCommand({
        TableName: APPLICANTS_TABLE,
      })
    );

    // Map to the format your Handlebars template expects
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
        TableName: PROPOSALS_TABLE,
      })
    );

    proposalNotifications = (proposalResult.Items || []).map((item) => ({
      Submission: true,
      ProjectName: item.proposal_title,
      Date: item.created_at ? item.created_at.split("T")[0] : "N/A", // extract YYYY-MM-DD
      PartnerOrg: item.partner_id,
      href: "/adminproposal/" + item.proposal_id,
    }));
  } catch (err) {
    console.error("Error fetching proposals:", err);
  }

  // Render admin dashboard
  res.render("admindashboard", {
    title: "Admin Dashboard",
    PartnerOrg: req.session.partner_name || "{Partner Org Name Holder}",

    // add project updates later
    Proposals: proposalNotifications,

    Application: applicants,
  });
};
