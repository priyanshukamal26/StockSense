import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

function createTransport() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Dev fallback: log to console only
  return null;
}

const transport = createTransport();

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (transport) {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "StockSense <noreply@stocksense.dev>",
      ...opts,
    });
  } else {
    // Dev-mode fallback: log the mail content
    console.info("[Mailer] Dev mode — email not sent. Content:");
    console.info(`  To: ${opts.to}`);
    console.info(`  Subject: ${opts.subject}`);
    console.info(`  Body: ${opts.text}`);
  }
}

export async function sendOtpEmail(
  to: string,
  otp: string
): Promise<{ devOtp?: string }> {
  const subject = "StockSense — Password Reset OTP";
  const text = `Your OTP for password reset is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.`;
  const html = `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
      <h2>Password Reset</h2>
      <p>Your one-time code is:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f7f7f8;border-radius:8px;text-align:center">${otp}</div>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p style="color:#969696;font-size:12px">If you did not request a password reset, you can safely ignore this email.</p>
    </div>`;

  await sendMail({ to, subject, text, html });

  if (isDev && !transport) {
    return { devOtp: otp };
  }
  return {};
}
