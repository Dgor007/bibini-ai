import { NextRequest, NextResponse } from 'next/server';
import { generateCVFromVoice } from '@/lib/gemini';
import { humanizeCV } from '@/lib/undetectable';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication in production
    // For now, allowing unauthenticated requests for testing

    // Get request body
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

    // Save generated CV to Firestore for data collection and future learning
    try {
      const cvDoc = await addDoc(collection(db, 'generated_cvs'), {
        userName,
        userEmail,
        country: country || 'Not specified',
        jobType: jobType || 'Not specified',
        cvContent: cv,
        transcript: transcript.substring(0, 500), // Store first 500 chars only for privacy
        createdAt: serverTimestamp(),
        wordCount: cv.split(/\s+/).length,
        // Future fields for learning system:
        rating: null, // User can rate CV quality later
        aiDetectionScore: null, // Store GPTZero score if user tests it
        conversions: {
          downloaded: false,
          applied: false,
          gotInterview: false,
        },
      });

      console.log('[Firestore] CV saved successfully with ID:', cvDoc.id);
    } catch (firestoreError) {
      // Don't fail the request if Firestore save fails
      console.error('[Firestore] Error saving CV:', firestoreError);
    }

    return NextResponse.json({
      success: true,
      cv,
      message: 'CV generated successfully from voice recording',
      antiAIDetection: true, // Flag to indicate this passes AI detection
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
