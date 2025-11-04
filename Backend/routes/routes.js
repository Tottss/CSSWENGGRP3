import express from "express";
import { userLogIn, createTestUser } from "../services/user.js";
import applyRouter from "./apply.js";
import proposalRouter from "./proposal.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import { getUserProjects } from "../services/projects.js";

const router = express.Router();

router.get("/test", function (req, res) {
  res.status(200).json("Hello, world!");
});

// implement other routes here
router.post("/user/login", userLogIn);

// test user creation route
router.post("/user/createTestUser", createTestUser);

// apply.js
router.use("/request", applyRouter);

// login route
router.get("/", (req, res) => {
  res.render("login", { 
    title: "Login Page",
    layout: false
  });
});

router.get("/login", (req, res) => {
  res.render("login", { 
    title: "Login Page",
    layout: false
  });
});

// logout route
router.get("/logout", (req, res) => {
  // only redirect to login for now (no session handling yet)
  res.redirect("/login");
});

// apply route
router.get("/apply", (req, res) => {
  res.render("apply", {
    title: "Application Page",
    layout: false
  });
});

//admin view route
router.get("/adminView", (req, res) => {
  res.render("adminView", {
    title: "Admin View",
  });
});

//user view route
router.get("/userView", (req, res) => {
  res.render("userView", {
    title: "User View",
  });
});

//dashboard route
router.get("/dashboard", async (req, res) => {
  try {
    const userId = 2; // temporary hardcode until sessions are added

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

    res.render("dashboard", {
      title: "Dashboard",
      PartnerOrg: "Partner Org Name",
      nNotif: 1,

      // Community Projects
      CommunityProjects: communityProjects.map((p) => ({
        ProjectImageURL: p.ProjectImageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),

      // Your Projects
      YourProjects: yourProjects.map((p) => ({
        ProjectImageURL: p.ProjectImageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Failed to load dashboard");
  }
});


//project proposal route
router.get("/proposal", (req, res) => {
  res.render("proposal", {
    title: "Project Proposal"
  });
});

// your project route
router.get("/Yourprojects", getUserProjects);

router.use("/proposal", proposalRouter);

//community projects route
router.get("/Communityprojects", async (req, res) => {
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
        ProjectImageURL: p.ProjectImageURL || "/ASSETS/border-design.png",
        ProjectName: p.project_name,
      })),
    });
  } catch (err) {
    console.error("Error loading community projects:", err);
    res.status(500).render("error", {
      message: "Failed to load community projects.",
    });
  }
});

export default router;
