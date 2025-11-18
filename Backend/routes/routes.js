import express from "express";
import { userLogIn, createTestUser } from "../services/user.js";
import applyRouter from "./apply.js";
import proposalRouter from "./proposal.js";
import impactTrackerRouter from "./impactTracker.js";
import adminProposalRouter from "./admin/adminproposal.js";
import { getUserProjects } from "../services/projects.js";

const router = express.Router();

// remove after making it a function
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

// controllers
import { showLogin, logoutUser } from "../controllers/authController.js";
import { showApplyPage } from "../controllers/applyController.js";
import {
  showAdminDashboard,
  showAdminView,
} from "../controllers/adminController.js";
import {
  showEditProfile,
  showViewProfile,
  updateProfile,
} from "../controllers/profileController.js";
import {
  showCommunityProjects,
  showViewProject,
} from "../controllers/projectController.js";
import { userDashboard } from "../controllers/dashboardController.js";
import { showProposal } from "../controllers/proposalController.js";

// this route is just for testing
router.get("/test", function (req, res) {
  res.status(200).json("Hello, world!");
});

// implement other routes here
router.post("/user/login", userLogIn);
router.get("/", showLogin);
router.get("/login", showLogin);

// test user creation route
router.post("/user/createTestUser", createTestUser);

// apply
router.use("/request", applyRouter);
router.get("/apply", showApplyPage);

// logout route
router.get("/logout", logoutUser);

//admin view route
router.get("/adminView", showAdminView);

//dashboard route
router.get("/dashboard", userDashboard);

//project proposal route
router.get("/proposal", showProposal);

// your project route
router.get("/Yourprojects", getUserProjects);

router.use("/proposal", proposalRouter);

//community projects route
router.get("/Communityprojects", showCommunityProjects);

router.get("/editprofile", showEditProfile);

// new
router.post("/editprofile/save", upload.single("profileImage"), updateProfile);

router.get("/admindashboard", showAdminDashboard);

// new
router.get("/profileview", showViewProfile);

// new
router.get("/viewProject", showViewProject);

router.use("/adminproposal", adminProposalRouter);

// impact tracker routes
router.use("/", impactTrackerRouter);

export default router;
