import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/gemini';
import { humanizeText } from '@/lib/undetectable';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication in production
    // For now, allowing unauthenticated requests for testing

    // Get request body
    const body = await request.json();
    const { role, company, experience, keySkills, whyCompany, userName } = body;

    // Validate required fields
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

    return NextResponse.json({
      success: true,
      coverLetter,
      message: 'Cover letter generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);

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
        error: 'Failed to generate cover letter',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
