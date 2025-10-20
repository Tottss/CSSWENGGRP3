import express from "express";
import { userLogIn, createTestUser } from "../services/user.js";
import applyRouter from "./apply.js";

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
    layout: false
  });
});

export default router;
