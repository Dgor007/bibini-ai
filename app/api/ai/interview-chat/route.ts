import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    const { success: withinLimit } = rateLimit(`chat:${authUser!.uid}`, { maxRequests: 60, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    const model = getGeminiModel();

    // Action: generate questions for a specific role
    if (action === 'generate-questions') {
      const { role, level } = body;
      if (!role) {
        return NextResponse.json(
          { error: 'Missing role for question generation' },
          { status: 400 }
        );
      }

      const prompt = `You are a professional UK interviewer. Generate exactly 12 interview questions for a "${role}" position${level ? ` at ${level} level` : ''}.

Mix these types:
- 3 behavioral questions (teamwork, conflict, motivation)
- 3 situational questions (how would you handle...)
- 3 role-specific technical questions
- 2 competency-based questions
- 1 closing question (why should we hire you / where do you see yourself)

Format your response as JSON array of objects:
[
  { "question": "Tell me about yourself and why you're interested in this role.", "category": "Opening", "tip": "Keep it to 2 minutes. Focus on relevant experience." },
  { "question": "...", "category": "Behavioral", "tip": "..." }
]

Return ONLY valid JSON, no other text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        return NextResponse.json({ success: true, questions: parsed });
      } catch {
        // Fallback questions
        return NextResponse.json({
          success: true,
          questions: [
            { question: `Tell me about yourself and why you're interested in this ${role} position.`, category: 'Opening', tip: 'Keep it to 2 minutes. Focus on relevant experience.' },
            { question: 'What do you know about our organisation?', category: 'Motivation', tip: 'Show you\'ve done your research.' },
            { question: `What relevant experience do you have for this ${role} role?`, category: 'Experience', tip: 'Use specific examples from your background.' },
            { question: 'Describe a time you worked well as part of a team.', category: 'Behavioral', tip: 'Use the STAR method: Situation, Task, Action, Result.' },
            { question: 'Tell me about a challenging situation at work and how you handled it.', category: 'Behavioral', tip: 'Focus on what you did and the positive outcome.' },
            { question: 'How do you handle pressure or tight deadlines?', category: 'Situational', tip: 'Give a real example, not just theory.' },
            { question: `What skills make you a good fit for this ${role} position?`, category: 'Competency', tip: 'Match your skills to the job requirements.' },
            { question: 'How do you stay motivated during repetitive tasks?', category: 'Behavioral', tip: 'Be honest and give practical strategies.' },
            { question: 'Describe a time you had to deal with a difficult customer or colleague.', category: 'Situational', tip: 'Show empathy and resolution skills.' },
            { question: 'What would you do if you disagreed with your manager\'s decision?', category: 'Situational', tip: 'Show respect while being constructive.' },
            { question: 'Where do you see yourself in the next few years?', category: 'Career Goals', tip: 'Show ambition but be realistic.' },
            { question: 'Why should we hire you over other candidates?', category: 'Closing', tip: 'Summarise your top 2-3 strengths confidently.' },
          ],
        });
      }
    }

    // Action: evaluate an answer
    if (action === 'evaluate') {
      const { role, question, answer, questionNumber, totalQuestions } = body;

      if (!question || !answer) {
        return NextResponse.json(
          { error: 'Missing question or answer for evaluation' },
          { status: 400 }
        );
      }

      const isLast = questionNumber >= totalQuestions;

      const prompt = `You are a professional UK interviewer evaluating a candidate's answer for a "${role}" position.

Question asked: "${question}"
Candidate's answer: "${answer}"
This is question ${questionNumber} of ${totalQuestions}.

Evaluate their answer and respond in this JSON format:
{
  "score": 7,
  "feedback": "2-3 sentences of specific, constructive feedback. What they did well and what to improve.",
  "strongPoints": "Brief note on what was good (1 sentence)",
  "improvementAreas": "Brief note on what to improve (1 sentence)",
  "modelAnswer": "A brief example of a strong answer for this question (3-4 sentences)"${isLast ? ',\n  "overallSummary": "A warm, encouraging 2-3 sentence summary of their overall interview performance."' : ''}
}

Be encouraging but honest. Score fairly (1-10 scale).
Return ONLY valid JSON, no other text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        return NextResponse.json({ success: true, ...parsed });
      } catch {
        return NextResponse.json({
          success: true,
          score: 6,
          feedback: 'Good attempt. Try to be more specific with examples from your experience. Using the STAR method can help structure your answers better.',
          strongPoints: 'You addressed the question directly.',
          improvementAreas: 'Try to include a specific example or story.',
          modelAnswer: `A strong answer would include a specific situation from your experience, what action you took, and the positive result. For example: "In my previous role, I faced a similar situation where... I decided to... and the outcome was..."`,
          ...(isLast ? { overallSummary: `Good practice session! You showed knowledge of the ${role} role. With more practice on specific examples, you'll do very well.` } : {}),
        });
      }
    }

    // Legacy: start action (keep backward compatibility)
    if (action === 'start') {
      const { role, level } = body;
      const prompt = `You are a professional interviewer conducting a mock interview for a ${role} position at ${level || 'entry'} level in the UK.

Generate the first interview question. Start with a warm, friendly greeting and then ask an opening question.

Format your response as JSON:
{
  "greeting": "Brief friendly greeting (1-2 sentences)",
  "question": "The interview question",
  "questionNumber": 1,
  "category": "behavioral" or "technical" or "situational",
  "tip": "A short tip for answering this type of question (1 sentence)"
}

Return ONLY valid JSON, no other text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        return NextResponse.json({ success: true, ...parsed });
      } catch {
        return NextResponse.json({
          success: true,
          greeting: `Welcome! Let's practice for your ${role} interview.`,
          question: `Tell me about yourself and why you're interested in this ${role} position.`,
          questionNumber: 1,
          category: 'behavioral',
          tip: 'Keep your answer to 2-3 minutes. Focus on relevant experience.',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in interview chat:', error);
    return NextResponse.json(
      { error: 'Failed to process interview chat', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
