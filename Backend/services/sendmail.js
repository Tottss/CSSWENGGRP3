import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Function to send email with form data and attachment
export async function sendApplicationEmail(formData, mouFile) {
  const {
    orgName,
    contactName,
    contactPosition,
    contactNumber,
    fullAddress,
    province,
    municipality,
    barangay,
    partnerType,
    advocacy,
  } = formData;

  // Setup transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email content
  const mailOptions = {
    from: `"Community Partner Portal" <noreply@cssweng.test>`,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Partner Application - ${orgName}`,
    text: `
New community partner application received:

Organization: ${orgName}
Contact Person: ${contactName} (${contactPosition})
Contact Number: ${contactNumber}

Address:
${fullAddress}, ${barangay}, ${municipality}, ${province}

Partner Type: ${partnerType}
Advocacy Focus: ${advocacy}
    `,
    attachments: mouFile
      ? [
          {
            filename: mouFile.originalname,
            content: mouFile.buffer,
          },
        ]
      : [],
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}