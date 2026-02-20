'use client';

import Header from '@/components/Header';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-400/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="font-serif text-4xl font-bold text-champagne mb-4">
          Something Went Wrong
        </h1>
        <p className="text-xl text-cream/70 mb-10">
          An unexpected error occurred. Please try again.
        </p>

        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
