import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewPrepGuide } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, company, industry } = body;

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

    return NextResponse.json({
      success: true,
      guide,
      message: 'Interview prep guide generated successfully',
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
