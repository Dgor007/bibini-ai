'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Header from '@/components/Header';
import { generatePDF, generateWord } from '@/lib/document-generators';

interface GeneratedDocument {
  id: string;
  cvContent: string;
  country: string;
  jobType: string;
  service: string;
  createdAt: any;
  wordCount: number;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [latestDoc, setLatestDoc] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const docsQuery = query(
            collection(db, 'generated_cvs'),
            where('userEmail', '==', currentUser.email),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(docsQuery);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setLatestDoc({
              id: doc.id,
              service: 'Document',
              ...doc.data(),
            } as GeneratedDocument);
          }
        } catch (error) {
          console.error('Error fetching document:', error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleDownloadPDF = () => {
    if (latestDoc) {
      const fileName = `${user?.displayName?.replace(/\s+/g, '_') || 'Document'}_BIBINI.pdf`;
      generatePDF(latestDoc.cvContent, fileName);
    }
  };

  const handleDownloadWord = async () => {
    if (latestDoc) {
      const fileName = `${user?.displayName?.replace(/\s+/g, '_') || 'Document'}_BIBINI.docx`;
      await generateWord(latestDoc.cvContent, fileName);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-gold/30 border-t-gold animate-spin"></div>
          <p className="text-champagne">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-400/20 flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            {sessionId ? 'Payment Successful!' : 'Document Ready!'}
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto">
            Thank you for choosing BIBINI AI. Your document is ready to download.
          </p>
          {sessionId && (
            <p className="text-sm text-cream/50 mt-4">
              Order ID: {sessionId.slice(-12)}
            </p>
          )}
        </div>

        {latestDoc ? (
          <>
            <div className="glass-light rounded-2xl p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-champagne mb-2">
                    Your {latestDoc.service || 'Document'} is Ready
                  </h2>
                  <div className="flex gap-6 text-sm">
                    {latestDoc.country && (
                      <div>
                        <span className="text-cream/50">Country:</span>{' '}
                        <span className="text-champagne">{latestDoc.country}</span>
                      </div>
                    )}
                    {latestDoc.jobType && (
                      <div>
                        <span className="text-cream/50">Job Type:</span>{' '}
                        <span className="text-champagne">{latestDoc.jobType}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-cream/50">Words:</span>{' '}
                      <span className="text-champagne">{latestDoc.wordCount}</span>
                    </div>
                  </div>
                </div>
                <span className="px-4 py-2 bg-green-400/20 text-green-400 rounded-full text-sm font-medium">
                  Ready
                </span>
              </div>

              <div className="bg-bgDarkest rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                <div className="text-cream/90 text-sm whitespace-pre-wrap leading-relaxed">
                  {latestDoc.cvContent.substring(0, 500)}...
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-4 bg-gold hover:bg-gold-dark text-bgDarkest font-bold rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="px-6 py-4 border-2 border-gold hover:bg-gold/10 text-gold font-bold rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  Download Word
                </button>
              </div>
            </div>

            {user?.email && (
              <div className="glass-light rounded-xl p-6 mb-8 text-center">
                <p className="text-cream/80 mb-2">
                  A copy has been sent to <span className="text-champagne font-semibold">{user.email}</span>
                </p>
                <p className="text-cream/60 text-sm">
                  You can also download from your dashboard anytime
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="glass-light rounded-2xl p-12 text-center mb-8">
            <p className="text-cream/70 mb-4">
              No documents found yet. Generate one from your dashboard.
            </p>
          </div>
        )}

        {/* Dashboard CTA */}
        <div className="text-center mt-12">
          <Link href="/dashboard">
            <button className="btn-primary text-lg">
              Go to Dashboard
            </button>
          </Link>
          <p className="text-cream/50 text-sm mt-4">
            Access all your documents anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-gold/30 border-t-gold animate-spin"></div>
          <p className="text-champagne">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
