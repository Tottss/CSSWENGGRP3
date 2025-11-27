import express from "express";
import { userLogIn } from "../services/user.js";
import proposalRouter from "./proposal.js";
import impactTrackerRouter from "./impactTracker.js";
import adminProposalRouter from "./admin/adminproposal.js";
import { getUserProjects } from "../services/projects.js";
import { changePassword } from "../services/changepassword.js";
import viewProposalsRouter from "./viewProposals.js";

const router = express.Router();
import multer from "multer";
const upload = multer();

// controllers
import { showLogin, logoutUser } from "../controllers/authController.js";
import {
  processApplication,
  showApplyPage,
} from "../controllers/applyController.js";
import { showAdminDashboard } from "../controllers/adminController.js";
import {
  showEditPassword,
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
import {
  saveupdateProposal,
  showUpdateProposal,
} from "../services/proposal.js";
import { showResourceHub } from "../controllers/resourceController.js";

// ADMIN ROUTES
router.get("/adminapplication/:applicant_id", showApplication);
router.post("/adminapplication/:applicant_id/approve", approveApplication);
router.post("/adminapplication/:applicant_id/decline", declineApplication);
router.get("/admindashboard", showAdminDashboard);
router.use("/adminproposal", adminProposalRouter);

// AUTH ROUTES
router.post("/user/login", userLogIn);
router.get("/", showLogin);
router.get("/login", showLogin);
router.get("/logout", logoutUser);

// APPLY ROUTES
router.get("/partnerapplication", showApplyPage);
router.post("/processapplication", upload.single("mou"), processApplication);

// USER DASHBOARD ROUTE
router.get("/dashboard", userDashboard);

// PROJECT ROUTES
router.get("/Yourprojects", getUserProjects);
router.get("/Communityprojects", listCommunityProjects);
router.get("/viewcommunityproject/:project_id", showCommunityProject);
router.get(
  "/viewcommunityproject/:project_id/generate",
  generateProgressReport
);
router.use("/", impactTrackerRouter);

// PROPOSAL ROUTES
router.use("/proposal", proposalRouter);
router.get("/proposal", showProposal);
router.use("/", viewProposalsRouter);
router.get("/updateProposal/:proposal_id", showUpdateProposal);
router.post(
  "/updateproposal/:proposal_id/save",
  upload.single("Proposal"),
  saveupdateProposal
);

// PROFILE ROUTES
router.get("/editprofile", showEditProfile);
router.post("/editprofile/save", upload.single("profileImage"), updateProfile);
router.get("/profileview", showViewProfile);
router.get("/editpassword", showEditPassword);
router.post("/editpassword", changePassword);

// PROGRESS ROUTES
router.get("/progress", showGenProg);
router.get("/progress/:project_id/generate", generateProgressReport);

router.delete("/progress/:id/delete", async (req, res) => {
  const { id } = req.params;

  try {
    await Project.deleteOne({ project_id: id });
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/deleteprojects", async (req, res) => {
  res.render("deleteprojects", {
  projects: [
    {
      project_id: "P001",
      project_name: "Community Feeding Program"
    },
    {
      project_id: "P002",
      project_name: "School Supplies Donation Drive"
    },
    {
      project_id: "P003",
      project_name: "Tree Planting Initiative"
    },
    {
      project_id: "P004",
      project_name: "Disaster Relief Operations"
    },
    {
      project_id: "P005",
      project_name: "Senior Citizen Outreach"
    }
  ]
});

});

// RESOURCE ROUTE
router.get("/resourcehub", showResourceHub);

export default router;
