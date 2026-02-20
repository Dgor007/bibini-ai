/**
 * Client-side helper to send emails via the /api/email/send route.
 * Called after content generation on service pages.
 */
export async function sendDeliveryEmail({
  to,
  userName,
  service,
  content,
}: {
  to: string;
  userName: string;
  service: string;
  content: string;
}) {
  try {
    const preview = content.substring(0, 300).replace(/\n/g, '<br>');

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: `Your ${service} from BIBINI AI is Ready!`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #1C1410; color: #F5F0E8; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #C6A15B; font-size: 28px; margin: 0;">BIBINI AI</h1>
              <p style="color: #F5F0E8; opacity: 0.7; margin-top: 5px;">Professional Career Services</p>
            </div>

            <div style="background: rgba(198,161,91,0.1); border: 1px solid rgba(198,161,91,0.3); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #C6A15B; margin-top: 0;">Hi ${userName},</h2>
              <p>Your <strong>${service}</strong> has been generated successfully!</p>
              <p>You can download it anytime from your <a href="https://bibini.org/dashboard" style="color: #C6A15B;">BIBINI Dashboard</a>.</p>
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #C6A15B; margin-top: 0;">Preview</h3>
              <p style="font-size: 13px; line-height: 1.6; opacity: 0.8;">${preview}...</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://bibini.org/dashboard" style="display: inline-block; background: #C6A15B; color: #1C1410; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(198,161,91,0.2);">
              <p style="font-size: 12px; opacity: 0.5;">
                BIBINI AI - Professional CV Services for African Professionals
              </p>
            </div>
          </div>
        `,
      }),
    });
  } catch (error) {
    // Don't block the user experience if email fails
    console.error('Failed to send delivery email:', error);
  }
}
