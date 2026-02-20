// Email templates for BIBINI AI services

const BRAND_COLORS = {
  gold: '#C6A15B',
  bronze: '#1C1410',
  champagne: '#E8D8B5',
  cream: '#F3EDE5',
};

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${BRAND_COLORS.bronze}; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_COLORS.bronze}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#2A1A12; border-radius:12px; border: 1px solid rgba(198,161,91,0.3); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid rgba(198,161,91,0.2);">
              <h1 style="margin:0; color:${BRAND_COLORS.gold}; font-size:28px; letter-spacing:2px;">BIBINI</h1>
              <p style="margin:4px 0 0; color:${BRAND_COLORS.champagne}; font-size:12px; letter-spacing:3px; text-transform:uppercase;">Your Career, Elevated</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid rgba(198,161,91,0.2);">
              <p style="margin:0; color:rgba(243,237,229,0.5); font-size:12px;">
                BIBINI AI &mdash; Professional CV Services for African Professionals
              </p>
              <p style="margin:8px 0 0; color:rgba(243,237,229,0.3); font-size:11px;">
                Questions? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function purchaseConfirmationEmail(params: {
  customerName: string;
  service: string;
  amount: number;
  currency: string;
}): { subject: string; html: string } {
  const serviceNames: Record<string, string> = {
    'voice-to-cv': 'Signature CV Creation',
    'cv-revamp': 'Executive CV Revamp',
    'interview-ai': 'AI Interview Practice',
    'interview-pdf': 'Interview Prep Guide',
    'cover-letter': 'Custom Cover Letter',
    'bundle': 'Complete Career Package',
  };

  const serviceName = serviceNames[params.service] || params.service;
  const amountFormatted = `${params.currency === 'gbp' ? '£' : '$'}${params.amount.toFixed(2)}`;

  const content = `
    <h2 style="color:${BRAND_COLORS.champagne}; margin:0 0 16px; font-size:22px;">
      Thank you for your purchase!
    </h2>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Hi ${params.customerName},
    </p>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Your order for <strong style="color:${BRAND_COLORS.gold};">${serviceName}</strong> has been confirmed.
    </p>

    <!-- Order Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(198,161,91,0.08); border:1px solid rgba(198,161,91,0.2); border-radius:8px; margin:0 0 24px;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:rgba(243,237,229,0.6); font-size:14px; padding:4px 0;">Service</td>
              <td align="right" style="color:${BRAND_COLORS.champagne}; font-size:14px; padding:4px 0;">${serviceName}</td>
            </tr>
            <tr>
              <td style="color:rgba(243,237,229,0.6); font-size:14px; padding:4px 0;">Amount Paid</td>
              <td align="right" style="color:${BRAND_COLORS.gold}; font-size:16px; font-weight:bold; padding:4px 0;">${amountFormatted}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 8px;">
      <strong>What happens next?</strong>
    </p>
    <p style="color:rgba(243,237,229,0.8); font-size:14px; line-height:1.8; margin:0 0 24px;">
      ${getNextStepsText(params.service)}
    </p>

    <!-- Dashboard Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
             style="display:inline-block; background:linear-gradient(135deg, #C6A15B 0%, #B88A44 100%); color:#1C1410; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
            View Your Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `BIBINI - Your ${serviceName} Order is Confirmed`,
    html: baseLayout(content),
  };
}

export function cvDeliveryEmail(params: {
  customerName: string;
  service: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="color:${BRAND_COLORS.champagne}; margin:0 0 16px; font-size:22px;">
      Your CV is Ready!
    </h2>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Hi ${params.customerName},
    </p>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Great news! Your professional CV has been generated and is ready for download.
    </p>
    <p style="color:rgba(243,237,229,0.8); font-size:14px; line-height:1.8; margin:0 0 24px;">
      You can download your CV in <strong style="color:${BRAND_COLORS.gold};">PDF</strong> or <strong style="color:${BRAND_COLORS.gold};">Word</strong> format from your dashboard.
    </p>

    <!-- Dashboard Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
             style="display:inline-block; background:linear-gradient(135deg, #C6A15B 0%, #B88A44 100%); color:#1C1410; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
            Download Your CV
          </a>
        </td>
      </tr>
    </table>

    <p style="color:rgba(243,237,229,0.5); font-size:13px; line-height:1.6; margin:24px 0 0; text-align:center;">
      Tip: Review your CV carefully and tailor it for each job application.
    </p>
  `;

  return {
    subject: 'BIBINI - Your Professional CV is Ready to Download',
    html: baseLayout(content),
  };
}

export function paymentFailedEmail(params: {
  customerName: string;
  service: string;
}): { subject: string; html: string } {
  const serviceNames: Record<string, string> = {
    'voice-to-cv': 'Signature CV Creation',
    'cv-revamp': 'Executive CV Revamp',
    'interview-ai': 'AI Interview Practice',
    'interview-pdf': 'Interview Prep Guide',
    'cover-letter': 'Custom Cover Letter',
    'bundle': 'Complete Career Package',
  };

  const serviceName = serviceNames[params.service] || params.service;

  const content = `
    <h2 style="color:${BRAND_COLORS.champagne}; margin:0 0 16px; font-size:22px;">
      Payment Issue
    </h2>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Hi ${params.customerName},
    </p>
    <p style="color:${BRAND_COLORS.cream}; font-size:16px; line-height:1.6; margin:0 0 24px;">
      We were unable to process your payment for <strong style="color:${BRAND_COLORS.gold};">${serviceName}</strong>.
    </p>
    <p style="color:rgba(243,237,229,0.8); font-size:14px; line-height:1.8; margin:0 0 24px;">
      This could be due to insufficient funds, an expired card, or a temporary bank issue. Please try again or use a different payment method.
    </p>

    <!-- Retry Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
             style="display:inline-block; background:linear-gradient(135deg, #C6A15B 0%, #B88A44 100%); color:#1C1410; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
            Try Again
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'BIBINI - Payment Issue with Your Order',
    html: baseLayout(content),
  };
}

function getNextStepsText(service: string): string {
  switch (service) {
    case 'voice-to-cv':
      return 'Your CV has been generated and is available on your dashboard. You can download it in PDF or Word format.';
    case 'cv-revamp':
      return 'Our AI is revamping your CV. You\'ll receive a notification when it\'s ready on your dashboard.';
    case 'interview-ai':
      return 'You now have access to AI Interview Practice. Head to your dashboard to start a practice session.';
    case 'interview-pdf':
      return 'Your personalised interview prep guide is being generated. It will be available on your dashboard shortly.';
    case 'cover-letter':
      return 'Your custom cover letter is being crafted. Check your dashboard in a few moments to download it.';
    case 'bundle':
      return 'You have access to all 5 BIBINI services. Visit your dashboard to start using each one.';
    default:
      return 'Your order is being processed. Check your dashboard for updates.';
  }
}
