'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function CancelPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        {/* Cancel Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-400/20 flex items-center justify-center">
          <span className="text-5xl">⚠️</span>
        </div>

        {/* Header */}
        <h1 className="font-serif text-4xl font-bold text-champagne mb-4">
          Payment Cancelled
        </h1>
        <p className="text-xl text-cream/70 mb-8">
          Your payment was not completed. No charges were made.
        </p>

        {/* Info Box */}
        <div className="glass-light rounded-2xl p-8 mb-8 text-left">
          <h3 className="font-serif text-xl font-bold text-champagne mb-4">
            What happened?
          </h3>
          <p className="text-cream/80 mb-4">
            You cancelled the payment process before it was completed. This is completely fine -
            your card was not charged.
          </p>
          <p className="text-cream/80">
            If you encountered any issues or have questions, please don't hesitate to contact us.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/dashboard">
            <button className="btn-primary w-full">
              Go to Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="w-full px-6 py-3 border border-gold/30 hover:border-gold text-champagne rounded-lg transition-colors">
              Back to Home
            </button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <p className="text-cream/50 text-sm mb-2">
            Need help? Contact us at
          </p>
          <a
            href="mailto:support@bibini.org"
            className="text-gold hover:text-gold-dark font-semibold"
          >
            support@bibini.org
          </a>
        </div>
      </div>
    </div>
  );
}
