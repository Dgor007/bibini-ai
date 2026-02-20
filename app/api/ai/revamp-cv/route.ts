import { NextRequest, NextResponse } from 'next/server';
import { revampCV } from '@/lib/gemini';
import { humanizeCV } from '@/lib/undetectable';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      revampedCV,
      message: 'CV revamped successfully',
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
