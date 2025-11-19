// controllers/applicationController.js

import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import crypto from "crypto"; // for random password
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export const showApplication = async (req, res) => {
  const applicantId = Number(req.params.applicant_id);
  const APPLICANTS_TABLE = "Applicants";

  console.log("Applicant ID; ", applicantId); // remove this after all is working

  try {
    // Query the applicant record
    const result = await docClient.send(
      new GetCommand({
        TableName: APPLICANTS_TABLE,
        Key: {
          applicant_id: applicantId, // must match your PK name
        },
      })
    );

    // If no record found
    if (!result.Item) {
      return res.status(404).send("Applicant not found");
    }

    const a = result.Item; // shorthand

    console.log("Applicant details: ", a); // remove after testing

    // Render the page using actual DynamoDB values
    res.render("adminapplication", {
      applicant_id: applicantId,
      orgname: a.partner_name,
      contactname: a.contact_name,
      contactposition: a.contact_position,
      contactnumber: a.contact_number,
      email: a.partner_email,
      address: a.partner_fulladdress,
      province: a.partner_province,
      municipality: a.partner_municipality,
      barangay: a.partner_barangay,
      partnertype: a.partner_type,
      advocacy: a.advocacy_focus,
    });
  } catch (err) {
    console.error("Error fetching applicant:", err);
    return res.status(500).send("Server Error");
  }
};

// route /application/approve
export const approveApplication = async (req, res) => {
  const applicantId = Number(req.params.applicant_id);

  try {
    // Fetch the applicant
    const result = await docClient.send(
      new GetCommand({
        TableName: APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    if (!result.Item) {
      return res.status(404).send("Applicant not found");
    }

    const a = result.Item;

    // Generate raw password
    const generatedPassword = crypto.randomBytes(4).toString("hex");

    // Hash the password
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    const loginData = {
      user_email: a.partner_email,
      hashed_password: hashedPassword,
      is_admin: false,
      partner_id: applicantId,
    };

    const partnerData = {
      partner_id: applicantId,
      partner_name: a.partner_name,
      partner_email: a.partner_email,
      contact_id: applicantId,
      location_id: applicantId,
      partner_type: a.partner_type,
      advocacy_focus: a.advocacy_focus,
      profile_picture: null,
    };

    const contactData = {
      contact_id: applicantId,
      contact_name: a.contact_name,
      contact_position: a.contact_position,
      contact_number: a.contact_number,
    };

    const locationData = {
      location_id: applicantId,
      full_address: a.partner_fulladdress,
      province: a.partner_province,
      municipality: a.partner_municipality,
      barangay: a.partner_barangay,
    };

    // Store records in DynamoDB
    await docClient.send(
      new PutCommand({ TableName: LOGIN_TABLE, Item: loginData })
    );
    await docClient.send(
      new PutCommand({ TableName: PARTNER_TABLE, Item: partnerData })
    );
    await docClient.send(
      new PutCommand({ TableName: CONTACT_TABLE, Item: contactData })
    );
    await docClient.send(
      new PutCommand({ TableName: LOCATION_TABLE, Item: locationData })
    );

    // Delete applicant afterwards
    await docClient.send(
      new DeleteCommand({
        TableName: APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    // Email placeholder
    console.log(
      `Login details sent to ${a.partner_email}: password=${generatedPassword}`
    );

    return res.status(200).send("Application approved successfully");
  } catch (err) {
    console.error("Error approving application:", err);
    return res.status(500).send("Server Error");
  }
};

// route /application/decline/
export const declineApplication = async (req, res) => {
  const applicantId = Number(req.params.applicant_id);

  const APPLICANTS_TABLE = "Applicants";

  try {
    // Fetch applicant for email + details
    const result = await docClient.send(
      new GetCommand({
        TableName: APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    if (!result.Item) {
      return res.status(404).send("Applicant not found");
    }

    const a = result.Item;

    // Delete the applicant
    await docClient.send(
      new DeleteCommand({
        TableName: APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    // (Optional) send rejection email
    console.log(
      `Rejection email sent to ${a.partner_email}: "Your application has been declined."`
    );

    // return res.status(200).send("Application declined and applicant removed");
    // Redirect to admin dashboard
    return res.redirect("/adminDashboard");
  } catch (err) {
    console.error("Error declining application:", err);
    return res.status(500).send("Server Error");
  }
};
