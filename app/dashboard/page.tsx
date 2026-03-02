'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Header from '@/components/Header';
import { generatePDF, generateWord } from '@/lib/document-generators';
import { PRICES, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { authFetch } from '@/lib/api-client';

interface GeneratedDocument {
  id: string;
  userName: string;
  userEmail: string;
  country: string;
  jobType: string;
  cvContent: string;
  createdAt: any;
  wordCount: number;
  service: string;
  isPaid: boolean;
  paymentStatus: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch user's generated documents from Firestore
        try {
          const docsQuery = query(
            collection(db, 'generated_cvs'),
            where('userEmail', '==', currentUser.email),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(docsQuery);
          const userDocs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as GeneratedDocument[];
          setDocuments(userDocs);
        } catch (error) {
          console.error('Error fetching documents:', error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-gold/30 border-t-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="font-serif text-4xl font-bold text-champagne mb-2">
              Welcome back, {user?.displayName?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-cream/70">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-cream/70 hover:text-gold transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Services Grid */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-bold text-champagne mb-8">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceItem
              icon="🎤"
              title="Voice-to-CV"
              price={`£${PRICES.VOICE_TO_CV}`}
              href="/voice-to-cv"
              description="Transform your voice into a world-class CV"
            />
            <ServiceItem
              icon="✨"
              title="CV Revamp"
              price={`£${PRICES.CV_REVAMP}`}
              href="/cv-revamp"
              description="Elevate your existing CV to global standards"
            />
            <ServiceItem
              icon="💬"
              title="AI Interview Practice"
              price={`£${PRICES.INTERVIEW_AI}`}
              href="/interview-ai"
              description="Practice with AI for real interview scenarios"
            />
            <ServiceItem
              icon="📄"
              title="Interview Prep Guide"
              price={`£${PRICES.INTERVIEW_PDF}`}
              href="/interview-pdf"
              description="Custom PDF guide tailored to your role"
            />
            <ServiceItem
              icon="✉️"
              title="Cover Letter Generator"
              price={`£${PRICES.COVER_LETTER}`}
              href="/cover-letter"
              description="Personalized cover letter that stands out"
            />
            <div
              className="relative z-0 rounded-2xl p-6 border-2 transition-all h-full cursor-pointer"
              style={{ borderColor: '#C6A15B', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
              onClick={() => router.push('/bundle')}
            >
              <span className="text-3xl mb-4 block">🎁</span>
              <h3 className="font-serif text-xl font-bold text-champagne mb-2">
                Complete Career Package
              </h3>
              <p className="text-gold font-serif text-2xl mb-3">£{PRICES.BUNDLE}</p>
              <p className="text-cream/70 text-sm mb-4">
                All 5 services (Save £34). The ultimate toolkit for your career.
              </p>
              <button
                className="w-full py-3 font-semibold rounded-lg text-sm transition-colors"
                style={{ backgroundColor: '#C6A15B', color: '#1a1a2e' }}
              >
                Get Bundle
              </button>
            </div>
          </div>
        </section>

        {/* My Documents */}
        <section>
          <h2 className="font-serif text-3xl font-bold text-champagne mb-8">
            My Documents
          </h2>
          {documents && documents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} user={user} />
              ))}
            </div>
          ) : (
            <div className="glass-light rounded-xl p-12 text-center">
              <p className="text-cream/60 mb-6">
                You haven't created any documents yet.
              </p>
              <Link href="/#services">
                <button className="btn-primary">Browse Services</button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ServiceItem({
  icon,
  title,
  price,
  href,
  description,
}: {
  icon: string;
  title: string;
  price: string;
  href: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(href)}
      className="relative z-0 rounded-2xl p-6 border border-transparent hover:border-gold transition-all cursor-pointer h-full"
      style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
    >
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="font-serif text-xl font-bold text-champagne mb-2">
        {title}
      </h3>
      <p className="text-gold font-serif text-xl mb-3">{price}</p>
      <p className="text-cream/70 text-sm">{description}</p>
    </div>
  );
}

const SERVICE_STRIPE_MAP: Record<string, string> = {
  'Voice-to-CV': 'voice-to-cv',
  'CV Revamp': 'cv-revamp',
  'Cover Letter': 'cover-letter',
  'Interview Prep Guide': 'interview-pdf',
};

const SERVICE_PRICE_KEY_MAP: Record<string, keyof typeof PRICES> = {
  'Voice-to-CV': 'VOICE_TO_CV',
  'CV Revamp': 'CV_REVAMP',
  'Cover Letter': 'COVER_LETTER',
  'Interview Prep Guide': 'INTERVIEW_PDF',
};

function DocumentCard({ document, user }: { document: GeneratedDocument; user: any }) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownloadPDF = () => {
    try {
      const fileName = `${document.userName.replace(/\s+/g, '_')}_CV.pdf`;
      generatePDF(document.cvContent, fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadWord = async () => {
    try {
      const fileName = `${document.userName.replace(/\s+/g, '_')}_CV.docx`;
      await generateWord(document.cvContent, fileName);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Failed to generate Word document. Please try again.');
    }
  };

  const handleUnlock = async () => {
    const serviceKey = SERVICE_STRIPE_MAP[document.service] || 'voice-to-cv';
    const priceKey = SERVICE_PRICE_KEY_MAP[document.service] || 'VOICE_TO_CV';

    try {
      const response = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS[priceKey],
          userId: user.uid,
          service: serviceKey,
          metadata: { documentId: document.id, service: serviceKey },
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const isPaid = document.isPaid === true;

  return (
    <div className="glass-light rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-champagne font-serif text-xl font-bold mb-1">
            {document.service || 'Voice-to-CV'}
          </h3>
          <p className="text-cream/60 text-sm">{formatDate(document.createdAt)}</p>
        </div>
        {isPaid ? (
          <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-sm font-medium">
            Paid
          </span>
        ) : (
          <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-medium">
            Locked
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-6">
        {document.country && (
          <div className="flex items-center text-sm">
            <span className="text-cream/50 w-24">Country:</span>
            <span className="text-champagne">{document.country}</span>
          </div>
        )}
        {document.jobType && (
          <div className="flex items-center text-sm">
            <span className="text-cream/50 w-24">Job Type:</span>
            <span className="text-champagne">{document.jobType}</span>
          </div>
        )}
        <div className="flex items-center text-sm">
          <span className="text-cream/50 w-24">Words:</span>
          <span className="text-champagne">{document.wordCount}</span>
        </div>
      </div>

      {/* Actions */}
      {isPaid ? (
        <div className="space-y-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full px-4 py-3 bg-gold hover:bg-gold-dark text-bgDarkest font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Download PDF
          </button>
          <button
            onClick={handleDownloadWord}
            className="w-full px-4 py-2 border border-gold/30 hover:border-gold text-gold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Download Word
          </button>
        </div>
      ) : (
        <button
          onClick={handleUnlock}
          className="w-full px-4 py-3 bg-gold hover:bg-gold-dark text-bgDarkest font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Unlock & Download — £{PRICES[SERVICE_PRICE_KEY_MAP[document.service] || 'VOICE_TO_CV']}
        </button>
      )}
    </div>
  );
}
