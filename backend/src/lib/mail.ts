import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in backend/.env`);
  }
  return value;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM &&
      process.env.APP_URL,
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, and APP_URL to backend/.env",
    );
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS").replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: requireEnv("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: requireEnv("SMTP_FROM"),
    to: params.to,
    subject: "Patient Chart — reset your password",
    text: [
      `Hi ${params.name},`,
      "",
      "We received a request to reset your Patient Chart password.",
      "Click the link below (valid for 30 minutes):",
      params.resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0A3D40; line-height: 1.5;">
        <p>Hi ${params.name},</p>
        <p>We received a request to reset your <strong>Patient Chart</strong> password.</p>
        <p>
          <a href="${params.resetUrl}" style="display:inline-block;background:#0A3D40;color:#fff;padding:12px 18px;text-decoration:none;">
            Reset password
          </a>
        </p>
        <p style="color:#5A6B69;font-size:13px;">This link expires in 30 minutes.</p>
        <p style="color:#5A6B69;font-size:13px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}
