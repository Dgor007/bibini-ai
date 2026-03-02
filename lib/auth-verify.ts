import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from './firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the decoded user or a 401 response.
 */
export async function verifyAuth(request: NextRequest): Promise<
  | { user: { uid: string; email: string | undefined; name: string | undefined }; error: null }
  | { user: null; error: NextResponse }
> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const app = getApps()[0];
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken);

    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      },
      error: null,
    };
  } catch (err) {
    console.error('Auth verification failed:', err);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      ),
    };
  }
}
