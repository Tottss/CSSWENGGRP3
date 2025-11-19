import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showAdminDashboard = async (req, res) => {
  const APPLICANTS_TABLE = "Applicants";

  let applicants = [];

  try {
    // Fetch all applicants
    const result = await docClient.send(
      new ScanCommand({
        TableName: APPLICANTS_TABLE,
      })
    );

    // Map to the format your Handlebars template expects
    applicants = result.Items.map((item) => ({
      PartnerOrg: item.partner_name,
      applicant_id: item.applicant_id,
    }));
    console.log("applicants: ", applicants);
  } catch (err) {
    console.error("Error fetching applicants:", err);
  }

  // Render admin dashboard
  res.render("admindashboard", {
    title: "Admin Dashboard",
    PartnerOrg: req.session.partner_name || "Partner Org Name",

    Proposals: [
      {
        Submission: true,
        ProjectName: "Project Name",
        Date: "2024-06-01",
        PartnerOrg: "EXAMPLE ORG",
        href: "/linktoProp",
      },
      {
        Update: true,
        ProjectName: "Example Project2",
        Date: "2024-08-21",
        PartnerOrg: "EORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
    ],

    // Dynamic from DynamoDB
    Application: applicants,
  });
};
