import nodemailer from "nodemailer";

interface SendPasswordNotificationParams {
  to: string;
  userName: string;
  newPassword: string;
  adminName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends the updated password to the user's Gmail / email address
 * using Gmail SMTP (Google App Password).
 */
export async function sendPasswordNotificationEmail({
  to,
  userName,
  newPassword,
  adminName = "System Administrator",
}: SendPasswordNotificationParams): Promise<EmailResult> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "").trim();

  if (!gmailUser || !gmailPass) {
    console.warn(
      "[MailService] Gmail credentials missing: GMAIL_USER or GMAIL_APP_PASSWORD not set in environment."
    );
    return {
      success: false,
      error:
        "Email delivery skipped: Gmail credentials not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.",
    };
  }

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Account Password Has Been Updated</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px 36px; text-align: left;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      IST Journals
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">
                      Security Notification &bull; Credential Update
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 36px 28px 36px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
                      Hello <strong>${userName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #64748b;">
                      Your account credentials for the <strong>IST Journals Platform</strong> have been updated by <strong>${adminName}</strong>. You can now use the new password provided below to access your account.
                    </p>

                    <!-- Credentials Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <div style="margin-bottom: 12px;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">Account Email</span>
                            <span style="font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-all;">${to}</span>
                          </div>
                          <div>
                            <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">New Password</span>
                            <span style="display: inline-block; font-family: monospace, Courier, sans-serif; font-size: 16px; font-weight: 700; color: #2563eb; background-color: #eff6ff; padding: 6px 12px; border-radius: 6px; border: 1px dashed #bfdbfe;">
                              ${newPassword}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Login Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                            Sign In to Portal
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #92400e;">
                        <strong>Security Recommendation:</strong> For your security, we suggest signing in and updating your password under your profile settings. If you did not request or expect this change, please contact the administrator immediately.
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                      Direct link: <a href="${loginUrl}" style="color: #2563eb; word-break: break-all;">${loginUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                      This is an automated notification from IST Journals Publishing Platform.<br/>
                      Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
Hello ${userName},

Your account password for the IST Journals Platform has been updated by ${adminName}.

Account Email: ${to}
New Password: ${newPassword}

Sign in to your account at: ${loginUrl}

Security Recommendation:
For your protection, please log in and change your password after signing in. If you did not request this update, contact your administrator immediately.

Best regards,
IST Journals Administration
    `.trim();

    const info = await transporter.sendMail({
      from: `"IST Journals Admin" <${gmailUser}>`,
      to,
      subject: "Your Account Password Has Been Updated - IST Journals",
      text: textContent,
      html: htmlContent,
    });

    console.log(`[MailService] Password email sent to ${to}, messageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[MailService] Error sending email to ${to}:`, error);
    return {
      success: false,
      error: error?.message || "Failed to send email via Gmail.",
    };
  }
}
