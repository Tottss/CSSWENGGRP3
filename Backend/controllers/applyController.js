import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import { sendEmail } from "../services/applicationmail.js";

export const processApplication = async (req, res) => {
  try {
    const requiredFields = [
      "orgName",
      "contactName",
      "contactPosition",
      "contactNumber",
      "email",
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

    // generate an auto-increment-like ID (timestamp-based)
    const applicantId = Date.now();

    const item = {
      applicant_id: applicantId,
      partner_name: req.body.orgName,
      contact_name: req.body.contactName,
      contact_position: req.body.contactPosition,
      contact_number: req.body.contactNumber,
      partner_email: req.body.email,
      partner_fulladdress: req.body.fullAddress,
      partner_province: req.body.province,
      partner_municipality: req.body.municipality,
      partner_barangay: req.body.barangay,
      partner_type: req.body.partnerType,
      advocacy_focus: req.body.advocacy,
      mou_url: req.file ? req.file.location : "none",
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.APPLICANTS_TABLE,
        Item: item,
      })
    );

    await sendEmail(
      req.body.email,
      "Application Sent",
      `Your application is now under review. Kindly wait for another email regarding your application status.`
    );

    res.status(200).json({
      success: true,
      message: "Application stored successfully.",
      id: applicantId,
    });
  } catch (err) {
    console.error("Error saving application:", err);
    res.status(500).json({ error: "Failed to store application." });
  }
};

export const showApplyPage = async (req, res) => {
  res.render("partnerapplication", {
    title: "Application Page",
    layout: false,
    isRequired: true,
  });
};
