import nodemailer from "nodemailer";

interface SendPasswordNotificationParams {
  to: string;
  userName: string;
  newPassword: string;
  adminName?: string;
  roles?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function formatRoleName(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Administrator",
    JOURNAL_MANAGER: "Journal Manager",
    EDITOR: "Associate Editor",
    SECTION_EDITOR: "Section Editor",
    REVIEWER: "Peer Reviewer",
    AUTHOR: "Author",
    COPYEDITOR: "Copy Editor",
    PRODUCTION_EDITOR: "Production Editor",
    READER: "Reader",
  };
  return map[role] || role.replace(/_/g, " ");
}

function getRoleBadgeColors(role: string): { bg: string; text: string; border: string } {
  switch (role) {
    case "ADMIN":
      return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
    case "JOURNAL_MANAGER":
      return { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe" };
    case "EDITOR":
    case "SECTION_EDITOR":
      return { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff" };
    case "REVIEWER":
      return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" };
    case "COPYEDITOR":
    case "PRODUCTION_EDITOR":
      return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
    default:
      return { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" };
  }
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
  roles = [],
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

  const appUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const loginUrl = `${appUrl}/login`;

  const roleBadgesHtml =
    roles && roles.length > 0
      ? roles
          .map((r) => {
            const colors = getRoleBadgeColors(r);
            const label = formatRoleName(r);
            return `<span style="display: inline-block; background-color: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border}; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 4px 2px 0;">${label}</span>`;
          })
          .join("")
      : `<span style="display: inline-block; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Standard User</span>`;

  const rolesText =
    roles && roles.length > 0 ? roles.map(formatRoleName).join(", ") : "Standard User";

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
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Password Updated - IST Journals</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
                <!-- Header Gradient Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%); padding: 36px 40px; text-align: left;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 8px; padding: 4px 10px; margin-bottom: 12px;">
                            <span style="font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Security &bull; Credential Update</span>
                          </div>
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                            IST Journals
                          </h1>
                          <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">
                            Academic Publishing &amp; Peer Review Platform
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 40px 28px 40px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #0f172a;">
                      Hello <strong>${userName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">
                      Your account credentials for the <strong>IST Journals Platform</strong> have been updated by <strong>${adminName}</strong>. Please find your updated account and access details below:
                    </p>

                    <!-- Account Details Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 26px; overflow: hidden;">
                      <!-- Row 1: Full Name -->
                      <tr>
                        <td width="35%" style="padding: 14px 18px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc; vertical-align: middle;">
                          Account Name
                        </td>
                        <td width="65%" style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                          ${userName}
                        </td>
                      </tr>

                      <!-- Row 2: Account Email -->
                      <tr>
                        <td width="35%" style="padding: 14px 18px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc; vertical-align: middle;">
                          Account Email
                        </td>
                        <td width="65%" style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-all; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                          ${to}
                        </td>
                      </tr>

                      <!-- Row 3: Assigned Role(s) -->
                      <tr>
                        <td width="35%" style="padding: 14px 18px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc; vertical-align: middle;">
                          Assigned Role
                        </td>
                        <td width="65%" style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                          ${roleBadgesHtml}
                        </td>
                      </tr>

                      <!-- Row 4: New Password -->
                      <tr>
                        <td width="35%" style="padding: 16px 18px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f8fafc; vertical-align: middle;">
                          New Password
                        </td>
                        <td width="65%" style="padding: 16px 18px; vertical-align: middle;">
                          <span style="display: inline-block; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 15px; font-weight: 700; color: #1d4ed8; background-color: #eff6ff; padding: 6px 14px; border-radius: 8px; border: 1px dashed #93c5fd; letter-spacing: 0.5px;">
                            ${newPassword}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Login Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); text-align: center;">
                            Sign In to Portal &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice Box -->
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
                      <p style="margin: 0; font-size: 12px; line-height: 19px; color: #92400e;">
                        <strong>Security Recommendation:</strong> For your security, we recommend signing in immediately and updating your password under your profile settings. If you did not request or expect this change, please notify your system administrator immediately.
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                      Direct portal link: <a href="${loginUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${loginUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 40px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                      IST Journals Publishing Platform
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                      This is an automated administrative notification. Please do not reply directly to this email.
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

ACCOUNT DETAILS:
------------------------------------------------
Account Name:   ${userName}
Account Email:  ${to}
Assigned Role:  ${rolesText}
New Password:   ${newPassword}
------------------------------------------------

Sign in to your account at:
${loginUrl}

Security Recommendation:
For your protection, please log in and change your password in your profile settings. If you did not expect this update, contact your administrator immediately.

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
