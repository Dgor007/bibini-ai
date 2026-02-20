import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-gold/30 flex items-center justify-center">
          <span className="font-serif text-4xl text-gold">404</span>
        </div>

        <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-cream/70 mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="space-y-4">
          <Link href="/">
            <button className="btn-primary w-full max-w-xs mx-auto block">
              Back to Home
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="w-full max-w-xs mx-auto block px-6 py-3 border border-gold/30 hover:border-gold text-champagne rounded-lg transition-colors">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
