import express from "express";
import { userLogIn } from "../services/user.js";
import proposalRouter from "./proposal.js";
import impactTrackerRouter from "./impactTracker.js";
import adminProposalRouter from "./admin/adminproposal.js";
import { getUserProjects } from "../services/projects.js";
import { changePassword } from "../services/changepassword.js";

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
  showCommunityProjects,
  showViewProject,
} from "../controllers/projectController.js";
import { userDashboard } from "../controllers/dashboardController.js";
import { showProposal } from "../controllers/proposalController.js";
import {
  approveApplication,
  declineApplication,
  showApplication,
} from "../controllers/applicationController.js";

/*
  Note: Only routes should be here
  Put logic either in services or controllers
*/

// this route is just for testing
router.get("/test", function (req, res) {
  res.status(200).json("Hello, world!");
});

// application route
// show, approve and decline application
router.get("/adminapplication/:applicant_id", showApplication);
router.post("/adminapplication/:applicant_id/approve", approveApplication);
router.post("/adminapplication/:applicant_id/decline", declineApplication);

// admin
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
router.get("/Communityprojects", showCommunityProjects);

router.get("/editprofile", showEditProfile);

// new
router.post("/editprofile/save", upload.single("profileImage"), updateProfile);

// new
router.get("/profileview", showViewProfile);

// new
router.get("/viewProject", showViewProject);

router.get("/adminapplication", (req, res) => {
  res.render("adminapplication", {
    orgname: "Aaaa",
    contactname: "john",
    contactposition: "Leader",
    contactnumber: "091284834",
    email: "jlawliong@gmail.com",
    address: "Quezon city",
    province: "Quezon City",
    municipality: "asdsd",
    barangay: "Igiveup",
    partnertype: "Church",
    advocacy: "poverty",
  });
});

router.get("/editpassword", (req, res) => {
  res.render("editpassword", {});
});
router.post("/editpassword", changePassword);

router.use("/adminproposal", adminProposalRouter);

// new - Hardcoded data only
router.get('/viewProject', (req, res) => {
    res.render('viewProject', {
        projtitle: "Test Project",
        orgName: "Bakhita Cannossa",
        ProjectDesc: "This is a test description.",
        projimage: "/ASSETS/project-photo1.jpg",
        Advocacyarea: "Education",
        SDG_alignment: "Quality Education",
        communitylocation: "Laguna, Philippines",
        nBeneficiaries: 30000,
        Timeline: "Jan 2025 - March 2026",
        Budget: "₱100,000",
        Proposal: "/ASSETS/project.pdf",
        lastUpdate: "2025-02-10",
        actualValue: 20000,
        targetValue: 30000,
        totalBudget: 50000,
        expenses: 20000,
        progress: 40,
        narrativeUpdate: "This is just a test narrative.",
        AdditionalImages: [
            "/ASSETS/project-photo1.jpg",
            "/ASSETS/project-photo2.jpg",
            "/ASSETS/project-photo1.jpg"
        ]
    });
});

// new - Hardcoded data only
router.get('/myproject', (req, res) => {
    res.render('myproject', {
        projtitle: "Project Title Here",
        projectID: 1,
        orgName: "Bakhita Cannossa",
        ProjectDesc: "This is a test description.",
        projimage: "/ASSETS/project-photo1.jpg",
        Advocacyarea: "Education",
        SDG_alignment: "Quality Education",
        communitylocation: "Laguna, Philippines",
        nBeneficiaries: 30000,
        Timeline: "Jan 2025 - March 2026",
        Budget: "₱100,000",
        Proposal: "/ASSETS/project.pdf",
        lastUpdate: "2025-02-10",
        actualValue: 20000,
        targetValue: 30000,
        totalBudget: 50000,
        expenses: 20000,
        progress: 40,
        narrativeUpdate: "This is just a test narrative.",
        AdditionalImages: [
            "/ASSETS/project-photo1.jpg",
            "/ASSETS/project-photo2.jpg",
            "/ASSETS/project-photo1.jpg"
        ]
    });
});

// NEW
router.get('/editproject', (req, res) => {
    res.render('editproject', {
        projtitle: "Project Title Here",
        projectID: 1,
        orgName: "Bakhita Cannossa",
        ProjectDesc: "This is a test description.",
        projimage: "/ASSETS/project-photo1.jpg",
        Advocacyarea: "Education",
        SDG_alignment: "Quality Education",
        communitylocation: "Laguna, Philippines",
        nBeneficiaries: 30000,
        Timeline: "Jan 2025 - March 2026",
        Budget: "₱100,000",
        Proposal: "/ASSETS/project.pdf",
        lastUpdate: "2025-02-10",
        actualValue: 20000,
        targetValue: 30000,
        totalBudget: 50000,
        expenses: 20000,
        progress: 40,
        narrativeUpdate: "This is just a test narrative.",
        AdditionalImages: [
            "/ASSETS/project-photo1.jpg",
            "/ASSETS/project-photo2.jpg",
            "/ASSETS/project-photo1.jpg"
        ]
    });
});

//New - Account Creation Route
router.get("/accountCreation", (req, res) => {
  res.render("accountcreation", {
    orgname: "Sample Org Name",
    contactName: "John Dave",
    contactPosition: "Director",
    contactNumber: "09123456789",
    email: "johndave@gmail.com",
    province: "Quezon City",
    municipality: "Quezon City",
    barangay: "Bagong Silang",
    partnerType: "School",
    advocacy: "Zero Hunger",
    temporaryPassword: "hello123",
  });
});

// impact tracker routes
router.use("/", impactTrackerRouter);



export default router;
