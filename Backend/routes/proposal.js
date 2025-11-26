// create proposal

import express from "express";
import multer from "multer";
import { createProposal } from "../services/proposal.js";

const router = express.Router();
const upload = multer();

router.post("/create", upload.single("Proposal"), createProposal);

export default router;
