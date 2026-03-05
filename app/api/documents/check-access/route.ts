import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-verify';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error: authError } = await verifyAuth(request);
    if (authError) return authError;

    const { success: withinLimit } = rateLimit(`check-access:${authUser!.uid}`, { maxRequests: 30, windowMs: 60 * 60 * 1000 });
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { service } = await request.json();

    if (!service) {
      return NextResponse.json({ error: 'Missing service' }, { status: 400 });
    }

    // Check purchases collection for this user + service
    const purchasesSnapshot = await adminDb
      .collection('purchases')
      .where('userEmail', '==', authUser!.email)
      .where('service', '==', service)
      .where('paymentStatus', '==', 'paid')
      .limit(1)
      .get();

    if (!purchasesSnapshot.empty) {
      return NextResponse.json({ hasAccess: true });
    }

    // Also check if user bought the bundle
    const bundleSnapshot = await adminDb
      .collection('purchases')
      .where('userEmail', '==', authUser!.email)
      .where('service', '==', 'bundle')
      .where('paymentStatus', '==', 'paid')
      .limit(1)
      .get();

    if (!bundleSnapshot.empty) {
      return NextResponse.json({ hasAccess: true });
    }

    return NextResponse.json({ hasAccess: false });
  } catch (error: any) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Failed to check access', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
