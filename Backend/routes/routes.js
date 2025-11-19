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

/*
  Note: Only routes should be here
  Put logic either in services or controllers
*/

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
    partnertype:"Church",
    advocacy:"poverty",
  });
});

router.get("/editpassword", (req, res) =>{
  res.render("editpassword", {
    
  })
})

router.get("/viewproposal-list", (req, res) =>{
  res.render("viewproposal-list", {
    Proposals: [{
      ProjectName: "This is an example project",
      Date: "11-16-2024"
    },
    {
      ProjectName: "This is an example project",
      Date: "11-16-2024"
    },
    {
      ProjectName: "This is an example project",
      Date: "11-16-2024"
    },
    {
      ProjectName: "This is an example project",
      Date: "11-16-2024"
    },
  ]
  });
});

router.get("/viewproposal", (req, res) => {
    res.render("viewproposal", {
        projTitle: "Community Clean-Up Drive",
        projSummary: "A project aiming to clean and beautify the local barangay area.",
        targetValue: "Local Residents",
        advoacyArea: "Environment",
        SDG: "SDG 11: Sustainable Cities and Communities",
        startDate: "2025-01-10",
        endDate: "2025-03-20",
        proposedBudget: "₱50,000",
        detailedProposal: "Full proposal PDF or text will be displayed here.",

        comments: [
            {
                date: "2025-11-18 10:32 AM",
                text: "This project looks promising!"
            },
            {
                date: "2025-11-18 11:00 AM",
                text: "Please add more details about the suppliers."
            }
        ]
    });
});


router.use("/adminproposal", adminProposalRouter);

// impact tracker routes
router.use("/", impactTrackerRouter);

export default router;
