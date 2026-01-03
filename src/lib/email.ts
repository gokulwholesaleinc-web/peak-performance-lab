/**
 * Email service for Peak Performance Lab
 * Currently uses console.log for development
 * Ready to be replaced with Resend in production
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@peakperformancelab.com';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email
 * TODO: Replace console.log with Resend API
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  // Development mode - log to console
  if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
    console.log('========== EMAIL ==========');
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text}`);
    console.log('===========================');
    return;
  }

  // Production mode with Resend
  // Uncomment and configure when ready:
  /*
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  */
}

/**
 * Send magic link email to user
 */
export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const magicLinkUrl = `${APP_URL}/api/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Sign in to Peak Performance Lab',
    text: `
Hello,

Click the link below to sign in to Peak Performance Lab:

${magicLinkUrl}

This link will expire in 15 minutes.

If you didn't request this email, you can safely ignore it.

Best,
Peak Performance Lab Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f4f4f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">
      Sign in to Peak Performance Lab
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #52525b;">
      Click the button below to sign in to your account. This link will expire in 15 minutes.
    </p>
    <a href="${magicLinkUrl}"
       style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Sign In
    </a>
    <p style="margin: 24px 0 0; font-size: 14px; color: #71717a;">
      If you didn't request this email, you can safely ignore it.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
      Peak Performance Lab
    </p>
  </div>
</body>
</html>
    `.trim(),
  });
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(
  email: string,
  appointment: {
    service: string;
    date: string;
    time: string;
    location?: string;
  }
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Appointment Confirmed: ${appointment.service}`,
    text: `
Hello,

Your appointment has been confirmed!

Service: ${appointment.service}
Date: ${appointment.date}
Time: ${appointment.time}
${appointment.location ? `Location: ${appointment.location}` : ''}

If you need to reschedule or cancel, please visit your dashboard:
${APP_URL}/dashboard

Best,
Peak Performance Lab Team
    `.trim(),
  });
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminder(
  email: string,
  appointment: {
    service: string;
    date: string;
    time: string;
    location?: string;
  }
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Reminder: ${appointment.service} Tomorrow`,
    text: `
Hello,

This is a reminder for your upcoming appointment:

Service: ${appointment.service}
Date: ${appointment.date}
Time: ${appointment.time}
${appointment.location ? `Location: ${appointment.location}` : ''}

If you need to reschedule or cancel, please visit your dashboard:
${APP_URL}/dashboard

Best,
Peak Performance Lab Team
    `.trim(),
  });
}
