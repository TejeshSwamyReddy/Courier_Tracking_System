import nodemailer from "nodemailer";

const canSendEmail = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

export const sendShipmentEmail = async ({
  to,
  subject,
  trackingId,
  status,
  message
}) => {
  if (!to || !canSendEmail()) {
    return { skipped: true };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: [
      `Tracking ID: ${trackingId}`,
      `Current Status: ${status}`,
      "",
      message
    ].join("\n")
  });

  return { skipped: false };
};

