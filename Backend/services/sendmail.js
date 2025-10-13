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
    email,
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

  // The email admin receives
  const adminMailOptions = {
    from: `"Community Partner Portal" <noreply@cssweng.test>`,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Partner Application - ${orgName}`,
    text: `
New community partner application received:

Organization: ${orgName}
Contact Person: ${contactName} (${contactPosition})
Contact Number: ${contactNumber}
Email: ${email}

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

  // The email applicant receives (edit content of mail later)
  const applicantMailOptions = {
    from: `"Community Partner Portal" <${process.env.EMAIL_USER}>`,
    to: formData.email,
    subject: "Application Received - Community Partner Portal",
    text: `
Dear ${contactName},

Thank you for applying to be a community partner with us. We have received your application and will review it shortly.

Best regards, *****
`
  };

  // Send the email
  await transporter.sendMail(adminMailOptions);
  await transporter.sendMail(applicantMailOptions);
}