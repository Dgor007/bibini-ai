import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
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
