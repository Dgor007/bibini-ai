import { NextRequest, NextResponse } from 'next/server';
import { generateCVFromVoice } from '@/lib/gemini';
import { humanizeCV } from '@/lib/undetectable';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    // Rate limit: 5 generations per hour per user
    const { success: withinLimit } = rateLimit(`gen-cv:${authUser!.uid}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { transcript, userName, userEmail, phone, location, country, jobType } = body;

    // Validate required fields
    if (!transcript || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, userName, userEmail' },
        { status: 400 }
      );
    }

    // Generate CV from voice transcript using Gemini 2.5 Flash
    // with anti-AI-detection rules and regional customization
    const rawCV = await generateCVFromVoice({
      transcript,
      userName,
      userEmail,
      phone,
      location,
      country,
      jobType,
    });

    // Humanize through Undetectable.ai if API key is configured
    let cv = rawCV;
    if (process.env.UNDETECTABLE_API_KEY) {
      try {
        console.log('[Undetectable] Humanizing CV...');
        cv = await humanizeCV(rawCV);
        console.log('[Undetectable] CV humanized successfully');
      } catch (humanizeError) {
        console.error('[Undetectable] Humanization failed, using Gemini output:', humanizeError);
      }
    }

    // Save generated CV to Firestore (full content stored server-side only)
    let documentId = '';
    try {
      const cvDoc = await addDoc(collection(db, 'generated_cvs'), {
        userName,
        userEmail,
        country: country || 'Not specified',
        jobType: jobType || 'Not specified',
        service: 'Voice-to-CV',
        cvContent: cv,
        transcript: transcript.substring(0, 500),
        createdAt: serverTimestamp(),
        wordCount: cv.split(/\s+/).length,
        isPaid: false,
        paymentStatus: 'pending',
        stripeSessionId: null,
        paidAt: null,
      });
      documentId = cvDoc.id;
      console.log('[Firestore] CV saved with ID:', cvDoc.id);
    } catch (firestoreError) {
      console.error('[Firestore] Error saving CV:', firestoreError);
    }

    // Return preview only — full content unlocked after payment
    return NextResponse.json({
      success: true,
      documentId,
      preview: cv.substring(0, 200),
      wordCount: cv.split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error generating CV from voice:', error);

    // Check if it's a Google AI API error
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        {
          error: 'Google AI API key not configured. Please add GOOGLE_AI_API_KEY to your environment variables.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate CV from voice',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
