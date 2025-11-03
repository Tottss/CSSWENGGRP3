import express from "express";
import { userLogIn, createTestUser } from "../services/user.js";
import applyRouter from "./apply.js";
import proposalRouter from "./proposal.js";

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
    layout: false
  });
});

//user view route
router.get("/userView", (req, res) => {
  res.render("userView", {
    title: "User View",
  });
});

//dashboard route
router.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    PartnerOrg: "Partner Org Name",
    nNotif: 1,
    Projects: [
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 1" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 2" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 3" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 4" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 5" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 6" },
      { ProjectImageURL: "/ASSETS/border-design.png", ProjectName: "Project 7" },
    ]
  });
});

;//project proposal route
router.get("/proposal", (req, res) => {
  res.render("proposal", {
    title: "Project Proposal"
  });
});

router.use("/proposal", proposalRouter);

export default router;
