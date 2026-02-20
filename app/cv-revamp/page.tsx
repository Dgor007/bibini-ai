'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generatePDF, generateWord } from '@/lib/document-generators';
import { sendDeliveryEmail } from '@/lib/send-email';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CVRevampPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [revampedCV, setRevampedCV] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      alert('Please upload a PDF, Word, or text document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setCvText(text);
      } else {
        const text = await file.text();
        setCvText(text);
      }
    } catch {
      setCvText('');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const textToRevamp = cvText.trim();
    if (!textToRevamp) {
      alert('Please upload your CV or paste the text below.');
      return;
    }

    setIsGenerating(true);
    setGeneratingStep(0);

    const stepTimer = setInterval(() => {
      setGeneratingStep((prev) => Math.min(prev + 1, 3));
    }, 6000);

    try {
      const response = await fetch('/api/ai/revamp-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: textToRevamp,
          userName: user.displayName || 'Applicant',
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRevampedCV(data.revampedCV);

        await addDoc(collection(db, 'generated_cvs'), {
          userEmail: user.email,
          userName: user.displayName || 'User',
          cvContent: data.revampedCV,
          service: 'CV Revamp',
          country: 'UK',
          jobType: 'CV Revamp',
          wordCount: data.revampedCV.split(/\s+/).length,
          createdAt: new Date(),
        });

        // Send delivery email
        sendDeliveryEmail({
          to: user.email,
          userName: user.displayName || 'there',
          service: 'CV Revamp',
          content: data.revampedCV,
        });
      } else {
        alert(data.error || 'Failed to revamp CV. Please try again.');
      }
    } catch (error) {
      console.error('Error revamping CV:', error);
      alert('Failed to revamp CV. Please try again.');
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
    }
  };

  const generatingSteps = [
    'Analysing your current CV...',
    'Restructuring for UK standards...',
    'Polishing language for authenticity...',
    'Finalising your revamped CV...',
  ];

  const handleDownloadPDF = () => {
    const name = user?.displayName?.replace(/\s+/g, '_') || 'CV';
    generatePDF(revampedCV, `${name}_Revamped_CV.pdf`);
  };

  const handleDownloadWord = async () => {
    const name = user?.displayName?.replace(/\s+/g, '_') || 'CV';
    await generateWord(revampedCV, `${name}_Revamped_CV.docx`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            Executive CV Revamp
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
            Elevate your existing CV to international standards. We'll refine, modernize,
            and optimize it for global opportunities.
          </p>
          <div className="inline-block glass-light rounded-full px-6 py-2">
            <span className="text-gold font-serif text-3xl font-bold">£29</span>
          </div>
        </div>

        {/* Generated Result */}
        {revampedCV ? (
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              Your Revamped CV is Ready!
            </h2>
            <div className="bg-white/5 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
              <div className="text-cream/90 whitespace-pre-wrap text-sm leading-relaxed">
                {revampedCV}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 px-6 py-3 bg-gold hover:bg-gold-dark text-bgDarkest font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Download PDF
              </button>
              <button
                onClick={handleDownloadWord}
                className="flex-1 px-6 py-3 border border-gold/30 hover:border-gold text-gold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Download Word
              </button>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => { setRevampedCV(''); setCvText(''); setSelectedFile(null); }}
                className="text-cream/50 hover:text-cream/80 text-sm transition-colors"
              >
                Revamp another CV
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Benefits */}
            <section className="glass-light rounded-2xl p-8 mb-12">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
                What You'll Get
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: 'ATS Optimization', desc: 'Formatted to pass Applicant Tracking Systems used by 90% of companies' },
                  { title: 'Professional Formatting', desc: 'Clean, modern design that stands out in the right way' },
                  { title: 'Impact-Driven Language', desc: 'Rewritten to emphasize achievements and quantifiable results' },
                  { title: 'Dual Format', desc: 'Delivered in both PDF and editable Word document' },
                ].map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-gold">✓</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-champagne mb-1">{b.title}</h3>
                      <p className="text-cream/70 text-sm">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Upload Section */}
            <section className="glass-light rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
                Upload Your Current CV
              </h2>

              <div className="max-w-lg mx-auto">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gold/30 rounded-xl p-12 text-center cursor-pointer hover:border-gold transition-all mb-6"
                >
                  {selectedFile ? (
                    <div>
                      <svg className="w-16 h-16 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-champagne font-semibold mb-2">{selectedFile.name}</p>
                      <p className="text-cream/60 text-sm mb-4">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      <p className="text-gold text-sm">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-16 h-16 mx-auto mb-4 text-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-champagne font-semibold mb-2">Click to upload your CV</p>
                      <p className="text-cream/60 text-sm">PDF, Word, or text document (Max 10MB)</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />

                <div className="mb-6">
                  <label className="block text-cream/90 mb-2 font-medium">
                    Or paste your CV text below
                  </label>
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    rows={8}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all resize-none text-sm"
                    placeholder="Paste your current CV content here..."
                  />
                </div>
              </div>
            </section>

            {/* Generate Button */}
            <div className="text-center">
              <Button onClick={handleGenerate} disabled={isGenerating || !cvText.trim()}>
                {isGenerating
                  ? 'Revamping Your CV...'
                  : user
                  ? 'Revamp My CV'
                  : 'Sign in to Revamp'}
              </Button>
              {!user && (
                <p className="text-cream/60 text-sm mt-4">
                  You'll need to sign in before revamping
                </p>
              )}
              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <p className="text-gold text-sm font-medium">{generatingSteps[generatingStep]}</p>
                  <div className="w-48 mx-auto h-1 bg-cream/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all duration-1000"
                      style={{ width: `${((generatingStep + 1) / generatingSteps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-cream/40 text-xs">This may take 20-30 seconds</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
