import express from "express";
import { userLogIn } from "../services/user.js";
import applyRouter from "./apply.js";

const router = express.Router();

router.get("/test", function (req, res) {
  res.status(200).json("Hello, world! HAHA");
});

// implement other routes here
router.post("/user/login", userLogIn);

router.use("/request", applyRouter);

export default router;
