import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    // Rate limit: 5 emails per hour per user
    const { success: withinLimit } = rateLimit(`email:${authUser!.uid}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { subject, html } = await request.json();

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields (subject, html)' },
        { status: 400 }
      );
    }

    // Only allow sending to the authenticated user's own email
    const to = authUser!.email;
    if (!to) {
      return NextResponse.json(
        { error: 'No email address associated with your account' },
        { status: 400 }
      );
    }

    const from = process.env.RESEND_FROM_EMAIL || 'BIBINI <onboarding@resend.dev>';

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
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
