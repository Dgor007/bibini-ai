import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    // Rate limit: 20 unlock attempts per hour
    const { success: withinLimit } = rateLimit(`unlock:${authUser!.uid}`, { maxRequests: 20, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 403 }
      );
    }

    // Verify the session belongs to this user
    if (session.client_reference_id !== authUser!.uid) {
      return NextResponse.json(
        { error: 'Unauthorized: session does not belong to this user' },
        { status: 403 }
      );
    }

    const documentId = session.metadata?.documentId;

    if (!documentId) {
      return NextResponse.json(
        { error: 'No document linked to this payment' },
        { status: 404 }
      );
    }

    // Fetch document from Firestore
    const docRef = adminDb.collection('generated_cvs').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data()!;

    // Return full content
    return NextResponse.json({
      success: true,
      document: {
        id: docSnap.id,
        cvContent: data.cvContent,
        service: data.service,
        userName: data.userName,
        wordCount: data.wordCount,
        isPaid: data.isPaid,
      },
    });
  } catch (error: any) {
    console.error('Error unlocking document:', error);
    return NextResponse.json(
      { error: 'Failed to unlock document', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
