import express from "express";
import multer from "multer";
import { sendApplicationEmail } from "../services/sendmail.js";

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/apply", upload.single("mou"), async (req, res) => {
    try {
        const requiredFields = [
        "orgName",
        "contactName",
        "contactPosition",
        "contactNumber",
        "fullAddress",
        "province",
        "municipality",
        "barangay",
        "partnerType",
        "advocacy",
        ];

        for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `Missing field: ${field}` });
        }
        }

        await sendApplicationEmail(req.body, req.file);
        res.status(200).json({ success: true, message: "Application submitted successfully." });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ error: "Failed to send application." });
    }
});

export default router;