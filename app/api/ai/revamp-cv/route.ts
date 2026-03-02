import { NextRequest, NextResponse } from 'next/server';
import { revampCV } from '@/lib/gemini';
import { humanizeCV } from '@/lib/undetectable';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    const { success: withinLimit } = rateLimit(`revamp:${authUser!.uid}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cvText, userName, userEmail } = body;

    if (!cvText || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: cvText, userName, userEmail' },
        { status: 400 }
      );
    }

    const rawCV = await revampCV({
      currentCVText: cvText,
      userName,
      userEmail,
    });

    // Humanize through Undetectable.ai if API key is configured
    let revampedCV = rawCV;
    if (process.env.UNDETECTABLE_API_KEY) {
      try {
        console.log('[Undetectable] Humanizing revamped CV...');
        revampedCV = await humanizeCV(rawCV);
        console.log('[Undetectable] Revamped CV humanized successfully');
      } catch (humanizeError) {
        console.error('[Undetectable] Humanization failed, using Gemini output:', humanizeError);
      }
    }

    // Save to Firestore (full content stored server-side only)
    let documentId = '';
    try {
      const cvDoc = await addDoc(collection(db, 'generated_cvs'), {
        userName,
        userEmail,
        service: 'CV Revamp',
        country: 'UK',
        jobType: 'CV Revamp',
        cvContent: revampedCV,
        createdAt: serverTimestamp(),
        wordCount: revampedCV.split(/\s+/).length,
        isPaid: false,
        paymentStatus: 'pending',
        stripeSessionId: null,
        paidAt: null,
      });
      documentId = cvDoc.id;
      console.log('[Firestore] Revamped CV saved with ID:', cvDoc.id);
    } catch (firestoreError) {
      console.error('[Firestore] Error saving revamped CV:', firestoreError);
    }

    // Return preview only — full content unlocked after payment
    return NextResponse.json({
      success: true,
      documentId,
      preview: revampedCV.substring(0, 200),
      wordCount: revampedCV.split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error revamping CV:', error);

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Google AI API key not configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to revamp CV', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
