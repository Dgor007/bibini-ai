import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const resend = new Resend(process.env.RESEND_API_KEY);

const serviceNames: Record<string, string> = {
  'voice-to-cv': 'Voice-to-CV',
  'cv-revamp': 'CV Revamp',
  'interview-ai': 'AI Interview Practice',
  'interview-pdf': 'Interview Prep Guide',
  'cover-letter': 'Cover Letter Generator',
  'bundle': 'Complete Career Package',
};

async function sendConfirmationEmail(email: string, service: string, amount: number) {
  const from = process.env.RESEND_FROM_EMAIL || 'BIBINI <onboarding@resend.dev>';
  const serviceName = serviceNames[service] || service;

  await resend.emails.send({
    from,
    to: email,
    subject: `Payment Confirmed - ${serviceName} | BIBINI AI`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #1C1410; color: #F5F0E8; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C6A15B; font-size: 28px; margin: 0;">BIBINI AI</h1>
          <p style="color: #F5F0E8; opacity: 0.7; margin-top: 5px;">Professional Career Services</p>
        </div>

        <div style="background: rgba(198,161,91,0.1); border: 1px solid rgba(198,161,91,0.3); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #C6A15B; margin-top: 0;">Payment Confirmed!</h2>
          <p>Thank you for purchasing <strong>${serviceName}</strong>.</p>
          <p style="font-size: 14px; opacity: 0.8;">Amount: <strong>£${amount.toFixed(2)}</strong></p>
        </div>

        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #C6A15B; margin-top: 0;">What's Next?</h3>
          <p>Head to your dashboard to use your service and download your documents.</p>
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
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.client_reference_id;
        const service = session.metadata?.service || 'unknown';
        const documentId = session.metadata?.documentId;
        const customerEmail = session.customer_details?.email;
        const amount = session.amount_total ? session.amount_total / 100 : 0;

        console.log('Payment successful:', { userId, service, documentId, customerEmail, amount });

        // Save purchase record to Firestore
        try {
          await adminDb.collection('purchases').add({
            userId: userId || null,
            userEmail: customerEmail,
            service,
            documentId: documentId || null,
            serviceName: serviceNames[service] || service,
            amount,
            currency: session.currency,
            stripeSessionId: session.id,
            paymentStatus: session.payment_status,
            metadata: session.metadata || {},
            createdAt: new Date(),
          });
          console.log('Purchase record saved to Firestore');
        } catch (firestoreError) {
          console.error('Error saving purchase record:', firestoreError);
        }

        // Unlock the generated document
        if (documentId) {
          try {
            const docRef = adminDb.collection('generated_cvs').doc(documentId);
            await docRef.update({
              isPaid: true,
              paymentStatus: 'paid',
              stripeSessionId: session.id,
              paidAt: new Date(),
            });
            console.log(`Document ${documentId} unlocked`);
          } catch (unlockError) {
            console.error('Error unlocking document:', unlockError);
          }
        }

        // Send confirmation email
        if (customerEmail) {
          try {
            await sendConfirmationEmail(customerEmail, service, amount);
            console.log('Confirmation email sent to', customerEmail);
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
