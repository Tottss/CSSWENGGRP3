import nodemailer from "nodemailer";

// detect current update period (month and quarter)
export function getUpdatePeriod() {
  const now = new Date();

  const month = now.toLocaleString("en-US", { month: "long" });
  const quarter = "Q" + (Math.floor(now.getMonth() / 3) + 1);

  return `${month} (${quarter})`; // e.g. "November (Q4)"
}

// send impact tracker update email
export async function sendTrackerUpdateEmail(toEmail, projectName, updateData) {
  // ensure env variables exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Missing EMAIL_USER or EMAIL_PASS in .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const {
    updatePeriod,
    actualBeneficiaries,
    targetBeneficiaries,
    budget,
    expensesToDate,
    progressPercent,
    location,
    narrative,
  } = updateData;

  const htmlContent = `
        <h2>Impact Tracker Update Submitted</h2>

        <p>Your organization has submitted a new update for the project:</p>
        <h3>${projectName}</h3>

        <p><strong>Update Period:</strong> ${updatePeriod}</p>

        <h4>Beneficiaries</h4>
        <ul>
          <li><strong>Actual Beneficiaries:</strong> ${actualBeneficiaries}</li>
          <li><strong>Target Beneficiaries:</strong> ${targetBeneficiaries}</li>
        </ul>

        <h4>Financials</h4>
        <ul>
          <li><strong>Budget:</strong> ${budget}</li>
          <li><strong>Expenses to Date:</strong> ${expensesToDate}</li>
        </ul>

        <h4>Progress</h4>
        <p><strong>Progress Meter:</strong> ${progressPercent}%</p>

        <h4>Location</h4>
        <p>${location || "No location provided"}</p>

        <h4>Narrative Update</h4>
        <p>${narrative || "No narrative provided"}</p>

        <br>
        <p>You may log in anytime to view the project’s full tracker.</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Project Notifications" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Impact Tracker Update – ${projectName}`,
      html: htmlContent,
    });

    console.log(`Impact update email sent to ${toEmail}`);
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}
