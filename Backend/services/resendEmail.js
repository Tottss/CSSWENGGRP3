import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

export const resendEmail = async ({ to, subject, html }) => {
  try {
    // need to buy own domain if we want to receive from bakhita email
    // bought a cheap one haha
    const data = await resend.emails.send({
      from: "no-reply@bcfportal.xyz",
      to,
      subject,
      html,
    });

    console.log("Email sent:", data);
    return data;
  } catch (err) {
    console.error("Resend Error:", err);
    throw err;
  }
}; // THIS IS /services/resendEmail.js
