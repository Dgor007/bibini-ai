import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// TODO: Add your Resend API key to .env.local
// Get it from: https://resend.com/api-keys
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, attachments } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields (to, subject, html)' },
        { status: 400 }
      );
    }

    // TODO: Replace with your verified domain email
    const from = process.env.RESEND_FROM_EMAIL || 'BIBINI <onboarding@resend.dev>';

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Example usage from other parts of the app:
//
// Send purchase confirmation:
// await fetch('/api/email/send', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     to: 'user@example.com',
//     subject: 'Your BIBINI Purchase Confirmation',
//     html: `
//       <h1>Thank you for your purchase!</h1>
//       <p>Your ${service} order is being processed.</p>
//       <p>You'll receive your delivery within 24-48 hours.</p>
//     `,
//   }),
// });
//
// Send CV delivery:
// await fetch('/api/email/send', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     to: 'user@example.com',
//     subject: 'Your Professional CV is Ready!',
//     html: `
//       <h1>Your CV is ready!</h1>
//       <p>Please find your professional CV attached.</p>
//     `,
//     attachments: [
//       {
//         filename: 'cv.pdf',
//         content: base64Content,
//       },
//     ],
//   }),
// });
