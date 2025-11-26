import express from "express";
import { userLogIn } from "../services/user.js";
import proposalRouter from "./proposal.js";
import impactTrackerRouter from "./impactTracker.js";
import adminProposalRouter from "./admin/adminproposal.js";
import { getUserProjects } from "../services/projects.js";
import { changePassword } from "../services/changepassword.js";
import viewProposalsRouter from "./viewProposals.js";

const router = express.Router();

// remove after making it a function
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

// controllers
import { showLogin, logoutUser } from "../controllers/authController.js";
import {
  processApplication,
  showApplyPage,
} from "../controllers/applyController.js";
import { showAdminDashboard } from "../controllers/adminController.js";
import {
  showEditProfile,
  showViewProfile,
  updateProfile,
} from "../controllers/profileController.js";
import {
  listCommunityProjects,
  showCommunityProject,
  generateProgressReport,
} from "../controllers/projectController.js";
import { userDashboard } from "../controllers/dashboardController.js";
import { showProposal } from "../controllers/proposalController.js";
import {
  approveApplication,
  declineApplication,
  showApplication,
} from "../controllers/applicationController.js";
import { showGenProg } from "../controllers/generateProgress.js";

/*
  Note: Only routes should be here
  Put logic either in services or controllers
*/

// this route is just for testing
router.get("/test", function (req, res) {
  res.status(200).json("Hello, world!");
});

// admin application routes
router.get("/adminapplication/:applicant_id", showApplication);
router.post("/adminapplication/:applicant_id/approve", approveApplication);
router.post("/adminapplication/:applicant_id/decline", declineApplication);

router.get("/admindashboard", showAdminDashboard);

// implement other routes here
router.post("/user/login", userLogIn);
router.get("/", showLogin);
router.get("/login", showLogin);

// apply
router.get("/partnerapplication", showApplyPage);
router.post("/processapplication", upload.single("mou"), processApplication);

// logout route
router.get("/logout", logoutUser);

//dashboard route
router.get("/dashboard", userDashboard);

//project proposal route
router.get("/proposal", showProposal);

// your project route
router.get("/Yourprojects", getUserProjects);

router.use("/proposal", proposalRouter);

//community projects route
router.get("/Communityprojects", listCommunityProjects);

router.get("/editprofile", showEditProfile);

// new
router.post("/editprofile/save", upload.single("profileImage"), updateProfile);

// new
router.get("/profileview", showViewProfile);

// new - made a function for this route
router.get("/viewcommunityproject/:project_id", showCommunityProject);
router.get(
  "/viewcommunityproject/:project_id/generate",
  generateProgressReport
);

router.get("/editpassword", (req, res) => {
  res.render("editpassword", {});
});
router.post("/editpassword", changePassword);

router.use("/", viewProposalsRouter);

router.use("/adminproposal", adminProposalRouter);

// generate progress report route
router.get("/progress", showGenProg);
router.get("/progress/:project_id/generate", generateProgressReport);

// Test Update Prop
router.get("/updateProposal", (req, res) => {
  res.render("updateproposal", {
    DetailedProposal:"heeee",
    projTitle: "yipee",
    ProjSummary: "shdbsajdbs",
    TargetBeneficiaries: "100000",
    startDate: "2025-11-25",
    endDate: "2025-09-25",
    ProposedBudget: "12929",
  });
});
// impact tracker routes
router.use("/", impactTrackerRouter);

// test email
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

// Test route
router.get("/testresend", async (req, res) => {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "bakhitarep@gmail.com",
      subject: "Hello World",
      html: "<p>FROM DEPLOYED WEBSITE!Congrats on sending your <strong>first email</strong>!</p>",
    });

    console.log(result);

    return res.send("Email sent!");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Failed to send email");
  }
});

export default router;
