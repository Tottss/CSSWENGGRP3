// controllers/applicationController.js

import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";
import crypto from "crypto"; // for random password
import bcrypt from "bcrypt";

// delete this nodemailer if the new mailer works
import { sendEmail } from "../services/applicationmail.js";

// new resend api - for testing
import { resendEmail } from "../services/resendEmail.js";

const approvalMessage = (email, tempPassword) => `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
  Your application has been approved.<br><br>
  Here are your login details:<br>
  Email: ${email}<br>
  Temporary Password: ${tempPassword}<br><br>
  For security purposes, please change your password after logging in.<br>
  To do this, go to: Profile → Edit Profile → Change Password.
</div>
`;

const rejectionMessage = (email) => `
<p>Good day, ${email}.</p>

<p>Your application has been declined.</p>

<p>We appreciate your interest and encourage you to apply again in the future.</p>

<p>If you have any questions about this decision or believe it may have been made in error, 
please feel free to contact us at 09123456 or email us at ${process.env.EMAIL_USER}.</p>
`;

export const showApplication = async (req, res) => {
  if (!req.session.is_admin) {
    return res.status(403).send("Access denied. This is an admin only page.");
  }

  const applicantId = Number(req.params.applicant_id);

  console.log("Applicant ID; ", applicantId); // remove this after all is working

  try {
    // Query the applicant record
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.APPLICANTS_TABLE,
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

export const approveApplication = async (req, res) => {
  const applicantId = Number(req.params.applicant_id);

  try {
    // Fetch the applicant
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.APPLICANTS_TABLE,
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
      new PutCommand({
        TableName: process.env.LOGIN_CREDENTIALS_TABLE,
        Item: loginData,
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: process.env.PARTNER_ORG_TABLE,
        Item: partnerData,
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: process.env.CONTACT_PERSON_TABLE,
        Item: contactData,
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: process.env.LOCATION_TABLE,
        Item: locationData,
      })
    );

    // delete applicant records after account approval
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    await resendEmail({
      to: a.partner_email,
      subject: "Application Approved",
      html: approvalMessage(a.partner_email, generatedPassword),
    });

    // redirect to admin dashboard
    return res.redirect("/adminDashboard");
  } catch (err) {
    console.error("Error approving application:", err);
    return res.status(500).send("Server Error");
  }
};

export const declineApplication = async (req, res) => {
  const applicantId = Number(req.params.applicant_id);

  try {
    // fetch applicant for email + details
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    if (!result.Item) {
      return res.status(404).send("Applicant not found");
    }

    const a = result.Item;

    // delete the applicant
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.APPLICANTS_TABLE,
        Key: { applicant_id: applicantId },
      })
    );

    await resendEmail({
      to: a.partner_email,
      subject: "Application Declined",
      html: rejectionMessage(a.partner_email),
    });

    return res.redirect("/adminDashboard");
  } catch (err) {
    console.error("Error declining application:", err);
    return res.status(500).send("Server Error");
  }
}; // THIS IS /controllers/applicationController.js
