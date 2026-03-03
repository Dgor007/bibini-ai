import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    const { success: withinLimit } = rateLimit(`docs-list:${authUser!.uid}`, { maxRequests: 30, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const snapshot = await adminDb
      .collection('generated_cvs')
      .where('userEmail', '==', authUser!.email)
      .orderBy('createdAt', 'desc')
      .get();

    const documents = snapshot.docs.map((doc) => {
      const data = doc.data();
      const isPaid = data.isPaid === true;

      return {
        id: doc.id,
        userName: data.userName,
        userEmail: data.userEmail,
        country: data.country,
        jobType: data.jobType,
        service: data.service,
        wordCount: data.wordCount,
        isPaid: data.isPaid,
        paymentStatus: data.paymentStatus,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        // Only include full content for paid documents
        cvContent: isPaid ? data.cvContent : '',
      };
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
