import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

const PROJECTS_TABLE = "Projects";
const IMPACTTRACKER_TABLE = "ImpactTracker";
const PARTNERORG_TABLE = "PartnerOrg";

export const showCommunityProject = async (req, res) => {
  const project_id = Number(req.params.project_id);

  try {
    const projectResult = await docClient.send(
      new GetCommand({
        TableName: PROJECTS_TABLE,
        Key: { project_id: project_id },
      })
    );

    if (!projectResult.Item) {
      return res.status(404).send("Project not found");
    }

    const project = projectResult.Item;
    console.log("Project Test Log: ", project);

    const trackerResult = await docClient.send(
      new GetCommand({
        TableName: IMPACTTRACKER_TABLE,
        Key: { project_id: project_id },
      })
    );

    const tracker = trackerResult.Item || {};

    const partnerResult = await docClient.send(
      new GetCommand({
        TableName: PARTNERORG_TABLE,
        Key: { partner_id: Number(project.user_id) },
      })
    );

    const partner = partnerResult.Item || {};

    res.render("communityProject", {
      // From Projects table
      projtitle: project.project_name,
      projectID: project.project_id,
      orgName: partner.partner_name || "No Org Found",
      ProjectDesc: project.project_summary,
      projimage: project.project_imageURL,
      Advocacyarea: project.advocacyArea,
      SDG_alignment: project.sdgAlignment,
      communitylocation: project.location || "Not specified",
      Proposal:
        "https://proposals-storage.s3.ap-southeast-1.amazonaws.com/proposals/08150a89-14ab-4dcc-949f-eab757dd1ccf-Test+Proposal.pdf", // change to project.url

      // From ImpactTracker table
      nBeneficiaries: tracker.target_beneficiaries || 0,
      actualValue: tracker.actual_beneficiaries || 0,
      targetValue: tracker.target_beneficiaries || 0,
      expenses: tracker.expenses_to_date || 0,
      progress: tracker.progress_percent || 0,
      lastUpdate: tracker.lastUpdate || "N/A",
      narrativeUpdate: tracker.narrative || "No narrative provided",

      // Gallery images (from uploads array)
      galleryImages: [
        "/ASSETS/project-photo1.jpg",
        "/ASSETS/project-photo2.jpg",
        "/ASSETS/project-photo1.jpg",
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

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
