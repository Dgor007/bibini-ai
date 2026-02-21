import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewPrepGuide } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, company, industry, userName, userEmail } = body;

    if (!role || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: role, level' },
        { status: 400 }
      );
    }

    const guide = await generateInterviewPrepGuide({
      role,
      level,
      company,
      industry,
    });

    // Save to Firestore (full content stored server-side only)
    let documentId = '';
    try {
      const doc = await addDoc(collection(db, 'generated_cvs'), {
        userName: userName || 'User',
        userEmail: userEmail || '',
        service: 'Interview Prep Guide',
        country: 'UK',
        jobType: role,
        cvContent: guide,
        createdAt: serverTimestamp(),
        wordCount: guide.split(/\s+/).length,
        isPaid: false,
        paymentStatus: 'pending',
        stripeSessionId: null,
        paidAt: null,
      });
      documentId = doc.id;
      console.log('[Firestore] Interview guide saved with ID:', doc.id);
    } catch (firestoreError) {
      console.error('[Firestore] Error saving interview guide:', firestoreError);
    }

    // Return preview only — full content unlocked after payment
    return NextResponse.json({
      success: true,
      documentId,
      preview: guide.substring(0, 200),
      wordCount: guide.split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error generating interview prep guide:', error);

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Google AI API key not configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate interview prep guide', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
