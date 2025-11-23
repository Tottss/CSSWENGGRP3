import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import puppeteer from "puppeteer-core";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getChromePath() {
  try {
    return execSync("which chromium-browser").toString().trim();
  } catch {
    return execSync("which chromium").toString().trim();
  }
}

export const showCommunityProject = async (req, res) => {
  const project_id = Number(req.params.project_id);

  try {
    const projectResult = await docClient.send(
      new GetCommand({
        TableName: process.env.PROJECTS_TABLE,
        Key: { project_id: project_id },
      })
    );

    if (!projectResult.Item) {
      return res.status(404).send("Project not found");
    }

    const project = projectResult.Item;

    const partnerResult = await docClient.send(
      new GetCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        Key: { partner_id: Number(project.user_id) },
      })
    );

    const partner = partnerResult.Item || {};

    const locationResult = await docClient.send(
      new GetCommand({
        TableName: process.env.LOCATION_TABLE,
        Key: { location_id: Number(project.user_id) },
      })
    );

    const location = locationResult.Item || {};

    const formattedLocation = [
      location.full_address,
      location.barangay,
      location.municipality,
      location.province,
    ]
      .filter(Boolean)
      .join(", ");

    const proposalURL =
      project.proposalURL ||
      "https://proposals-storage.s3.ap-southeast-1.amazonaws.com/proposals/08150a89-14ab-4dcc-949f-eab757dd1ccf-Test+Proposal.pdf";

    // Gallery images (from uploads array)
    const galleryImages =
      project.uploads?.length > 0
        ? project.uploads
        : [
            "/ASSETS/project-photo1.jpg",
            "/ASSETS/project-photo2.jpg",
            "/ASSETS/project-photo1.jpg",
          ];

    res.render("communityProject", {
      // From Projects table
      projtitle: project.project_name || "Not specified",
      projectID: project.project_id || "Not specified",
      orgName: partner.partner_name || "Not specified",
      ProjectDesc: project.project_summary || "Not specified",
      Advocacyarea: project.advocacyArea || "Not specified",
      SDG_alignment: project.sdgAlignment || "Not specified",
      communitylocation: formattedLocation || "Not specified",
      Proposal: proposalURL,

      nBeneficiaries: project.target_beneficiaries || 0,
      actualValue: project.actual_beneficiaries || 0,
      targetValue: project.target_beneficiaries || 0,
      expenses: project.expenses_to_date || 0,
      progress: project.progress_percent || 0,

      lastUpdate: project.lastUpdate || "N/A",
      narrativeUpdate: project.narrative || "No narrative provided",

      Timeline: `${project.start_date} - ${project.end_date}`,
      Budget: project.budget,

      galleryImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export const listCommunityProjects = async (req, res) => {
  try {
    // Fetch ALL accepted projects from the Projects table
    const data = await docClient.send(
      new ScanCommand({
        TableName: process.env.PROJECTS_TABLE,
      })
    );

    const projects = data.Items || [];

    // remove before deployment
    console.log("Project ID: ", projects);
    // remove before deployment

    res.render("projects", {
      Title: "Community Projects",
      BtnName: "View Project",
      Projects: projects.map((p) => ({
        ProjectImageURL: p.project_imageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
        ProjectID: p.project_id || 0,
      })),
    });
  } catch (err) {
    console.error("Error loading community projects:", err);
    res.status(500).render("error", {
      message: "Failed to load community projects.",
    });
  }
};

export const generateProgressReport = async (req, res) => {
  const project_id = Number(req.params.project_id);

  try {
    // load project data
    const projectData = await docClient.send(
      new GetCommand({
        TableName: process.env.PROJECTS_TABLE,
        Key: { project_id },
      })
    );

    if (!projectData.Item) {
      return res.status(404).send("Project not found");
    }

    const project = projectData.Item;

    // load partner organization data
    const partnerResult = await docClient.send(
      new GetCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        Key: { partner_id: Number(project.user_id) },
      })
    );

    const partner = partnerResult.Item || {};

    // load location data
    const locationResult = await docClient.send(
      new GetCommand({
        TableName: process.env.LOCATION_TABLE,
        Key: { location_id: Number(project.user_id) },
      })
    );

    const location = locationResult.Item || {};
    const formattedLocation = [
      location.full_address,
      location.barangay,
      location.municipality,
      location.province,
    ]
      .filter(Boolean)
      .join(", ");

    // calculate additional metrics
    const beneficiaryRate =
      project.target_beneficiaries > 0
        ? Math.round(
            (project.actual_beneficiaries / project.target_beneficiaries) * 100
          )
        : 0;

    const remainingBudget =
      (project.budget || 0) - (project.expenses_to_date || 0);
    const budgetUtilization =
      project.budget > 0
        ? Math.round((project.expenses_to_date / project.budget) * 100)
        : 0;

    // prepare template data
    const templateData = {
      project_name: project.project_name || "Untitled Project",
      organization_name: partner.partner_name || "Unknown Organization",
      report_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      last_update: project.lastUpdate || "N/A",
      project_summary: project.project_summary || "No summary provided",
      advocacy_area: project.advocacyArea || "Not specified",
      sdg_alignment: project.sdgAlignment || "Not specified",
      timeline: `${project.start_date || "N/A"} - ${project.end_date || "N/A"}`,
      location: formattedLocation || "Not specified",
      progress_percent: project.progress_percent || 0,
      actual_beneficiaries: project.actual_beneficiaries || 0,
      target_beneficiaries: project.target_beneficiaries || 0,
      beneficiary_rate: beneficiaryRate,
      budget: (project.budget || 0).toLocaleString(),
      expenses_to_date: (project.expenses_to_date || 0).toLocaleString(),
      remaining_budget: remainingBudget.toLocaleString(),
      budget_utilization: budgetUtilization,
      narrative: project.narrative || "No narrative update provided.",
    };

    // read and compile the template
    const templatePath = path.join(
      __dirname,
      "../templates/progressReport.hbs"
    );
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    const html = template(templateData);

    // launch puppeteer to generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: getChromePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    await browser.close();

    // return PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ProgressReport_${project.project_name.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).send("Failed to generate report");
  }
};
