'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const services = [
  {
    icon: '🎤',
    title: 'Voice-to-CV',
    price: '£39',
    href: '/voice-to-cv',
    description: 'Transform your career story into a world-class CV',
  },
  {
    icon: '✨',
    title: 'CV Revamp',
    price: '£29',
    href: '/cv-revamp',
    description: 'Elevate your existing CV to international standards',
  },
  {
    icon: '💬',
    title: 'AI Interview Practice',
    price: '£29',
    href: '/interview-ai',
    description: 'Unlimited voice-based mock interviews with AI feedback',
  },
  {
    icon: '📄',
    title: 'Interview Prep Guide',
    price: '£17.99',
    href: '/interview-pdf',
    description: '50+ questions, model answers & preparation checklist',
  },
  {
    icon: '✉️',
    title: 'Cover Letter Generator',
    price: '£19',
    href: '/cover-letter',
    description: 'Personalized cover letters that get you noticed',
  },
];

export default function BundlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-4xl">🎁</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            Complete Career Package
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
            Everything you need to land your dream job. All 5 premium services
            in one powerful bundle.
          </p>
          <div className="inline-block glass-light rounded-full px-6 py-2">
            <span className="text-cream/60 line-through text-lg mr-3">£133.99</span>
            <span className="text-gold font-serif text-3xl font-bold">£99</span>
          </div>
          <p className="text-green-400 text-sm mt-2 font-medium">Save £34.99</p>
        </div>

        {/* What's Included */}
        <section className="glass-light rounded-2xl p-8 mb-12">
          <h2 className="font-serif text-2xl font-bold text-champagne mb-8 text-center">
            What's Included
          </h2>
          <div className="space-y-6">
            {services.map((service) => (
              <div key={service.title} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-xl">{service.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-champagne">{service.title}</h3>
                  <p className="text-cream/70 text-sm">{service.description}</p>
                </div>
                <div className="text-cream/50 text-sm line-through">{service.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="glass-light rounded-2xl p-8 mb-12">
          <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
            How the Bundle Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                <span className="text-gold font-bold">1</span>
              </div>
              <h3 className="font-semibold text-champagne mb-2">Get Access</h3>
              <p className="text-cream/70 text-sm">
                Sign in to unlock all 5 services from your dashboard.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                <span className="text-gold font-bold">2</span>
              </div>
              <h3 className="font-semibold text-champagne mb-2">Use Any Service</h3>
              <p className="text-cream/70 text-sm">
                Generate CVs, cover letters, prep guides, and practice interviews at your own pace.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                <span className="text-gold font-bold">3</span>
              </div>
              <h3 className="font-semibold text-champagne mb-2">Land Your Job</h3>
              <p className="text-cream/70 text-sm">
                Download everything in PDF and Word. Apply with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Service Links */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
            Start Using Your Services
          </h2>
          {!user ? (
            <div className="text-center">
              <p className="text-cream/70 mb-6">Sign in to access all bundle services.</p>
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-gold hover:bg-gold-dark text-bgDarkest font-bold rounded-lg transition-colors text-lg"
              >
                Sign In to Get Started
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <button
                  key={service.title}
                  onClick={() => router.push(service.href)}
                  className="relative z-0 rounded-2xl p-6 border border-transparent hover:border-gold transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
                >
                  <span className="text-2xl mb-3 block">{service.icon}</span>
                  <h3 className="font-serif text-lg font-bold text-champagne mb-1">
                    {service.title}
                  </h3>
                  <p className="text-cream/60 text-sm">{service.description}</p>
                  <span className="text-gold text-sm mt-3 block font-medium">
                    Use now &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
