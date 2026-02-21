import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/gemini';
import { humanizeText } from '@/lib/undetectable';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, company, experience, keySkills, whyCompany, userName, userEmail } = body;

    if (!role || !company || !experience || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: role, company, experience, userName' },
        { status: 400 }
      );
    }

    // Generate cover letter using Gemini 2.5 Flash
    const rawCoverLetter = await generateCoverLetter({
      role,
      company,
      experience,
      keySkills,
      whyCompany,
      userName,
    });

    // Humanize through Undetectable.ai if API key is configured
    let coverLetter = rawCoverLetter;
    if (process.env.UNDETECTABLE_API_KEY) {
      try {
        console.log('[Undetectable] Humanizing cover letter...');
        coverLetter = await humanizeText(rawCoverLetter, {
          purpose: 'Cover Letter',
          strength: 'More Human',
        });
        console.log('[Undetectable] Cover letter humanized successfully');
      } catch (humanizeError) {
        console.error('[Undetectable] Humanization failed, using Gemini output:', humanizeError);
      }
    }

    // Save to Firestore (full content stored server-side only)
    let documentId = '';
    try {
      const doc = await addDoc(collection(db, 'generated_cvs'), {
        userName,
        userEmail: userEmail || '',
        service: 'Cover Letter',
        country: 'UK',
        jobType: role,
        cvContent: coverLetter,
        createdAt: serverTimestamp(),
        wordCount: coverLetter.split(/\s+/).length,
        isPaid: false,
        paymentStatus: 'pending',
        stripeSessionId: null,
        paidAt: null,
      });
      documentId = doc.id;
      console.log('[Firestore] Cover letter saved with ID:', doc.id);
    } catch (firestoreError) {
      console.error('[Firestore] Error saving cover letter:', firestoreError);
    }

    // Return preview only — full content unlocked after payment
    return NextResponse.json({
      success: true,
      documentId,
      preview: coverLetter.substring(0, 200),
      wordCount: coverLetter.split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);

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
        error: 'Failed to generate cover letter',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
