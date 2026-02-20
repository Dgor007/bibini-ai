'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Button from '@/components/Button';
import Header from '@/components/Header';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full border-2 border-gold/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h1 className="font-serif text-4xl font-bold text-champagne text-center mb-2">
          Reset Password
        </h1>
        <p className="text-cream/80 text-center mb-8">
          Enter your email and we'll send you a reset link
        </p>

        {sent ? (
          <div className="glass-light rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-400/20 flex items-center justify-center">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-champagne mb-3">
              Check Your Email
            </h2>
            <p className="text-cream/70 mb-6">
              We've sent a password reset link to <span className="text-champagne font-medium">{email}</span>.
              Check your inbox and follow the instructions.
            </p>
            <p className="text-cream/50 text-sm mb-6">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-gold hover:text-gold-dark text-sm font-medium transition-colors"
            >
              Send again
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="glass-light border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-cream/90 mb-2 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-cream/70 mt-8">
          Remember your password?{' '}
          <Link href="/login" className="text-gold hover:text-gold-dark font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
