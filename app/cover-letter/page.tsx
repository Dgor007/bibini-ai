'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { generatePDF, generateWord } from '@/lib/document-generators';
import { PRICES, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { authFetch } from '@/lib/api-client';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CoverLetterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    experience: '',
    keySkills: '',
    whyCompany: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [preview, setPreview] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [fullContent, setFullContent] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!formData.role || !formData.company || !formData.experience) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsGenerating(true);
    setGeneratingStep(0);

    const stepTimer = setInterval(() => {
      setGeneratingStep((prev) => Math.min(prev + 1, 3));
    }, 5000);

    try {
      const response = await authFetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userName: user.displayName || 'Applicant',
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDocumentId(data.documentId);
        setPreview(data.preview);
        setIsPaid(false);
        setFullContent('');
      } else {
        alert(data.error || 'Failed to generate cover letter. Please try again.');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
    }
  };

  const generatingSteps = [
    'Understanding the role requirements...',
    'Crafting your cover letter...',
    'Polishing language for authenticity...',
    'Finalising your letter...',
  ];

  const handleUnlockPayment = async () => {
    if (!documentId) return;
    try {
      const response = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS.COVER_LETTER,
          userId: user.uid,
          service: 'cover-letter',
          metadata: { documentId, service: 'cover-letter' },
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const handleDownloadPDF = () => {
    generatePDF(fullContent, `Cover_Letter_${formData.company}.pdf`);
  };

  const handleDownloadWord = async () => {
    await generateWord(fullContent, `Cover_Letter_${formData.company}.docx`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            Custom Cover Letter
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
            A personalized, compelling cover letter that tells your story and makes
            hiring managers want to meet you.
          </p>
          <div className="inline-block glass-light rounded-full px-6 py-2">
            <span className="text-gold font-serif text-3xl font-bold">£{PRICES.COVER_LETTER}</span>
          </div>
        </div>

        {/* Generated Result */}
        {(preview || fullContent) ? (
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              {isPaid ? 'Your Cover Letter is Ready!' : 'Your Cover Letter Has Been Generated'}
            </h2>

            <div className="relative bg-white/5 rounded-xl p-6 mb-6 overflow-hidden">
              {isPaid ? (
                <div className="text-cream/90 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {fullContent}
                </div>
              ) : (
                <>
                  <div className="text-cream/90 whitespace-pre-wrap text-sm leading-relaxed">
                    {preview}...
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(28,20,16,0.97) 40%)' }}
                  >
                    <div className="text-center p-8 mt-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-champagne mb-2">
                        Unlock Your Cover Letter
                      </h3>
                      <p className="text-cream/70 mb-6 max-w-sm">
                        Your cover letter is ready. Unlock to view the full document and download in PDF & Word.
                      </p>
                      <button
                        onClick={handleUnlockPayment}
                        className="px-8 py-4 bg-gold hover:bg-gold-dark text-bgDarkest font-bold rounded-lg transition-all transform hover:scale-105 text-lg"
                      >
                        Unlock & Download — £{PRICES.COVER_LETTER}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {isPaid && (
              <>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleDownloadPDF} className="flex-1 px-6 py-3 bg-gold hover:bg-gold-dark text-bgDarkest font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    Download PDF
                  </button>
                  <button onClick={handleDownloadWord} className="flex-1 px-6 py-3 border border-gold/30 hover:border-gold text-gold rounded-lg transition-colors flex items-center justify-center gap-2">
                    Download Word
                  </button>
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setPreview(''); setFullContent(''); setDocumentId(null); setIsPaid(false); setFormData({ role: '', company: '', experience: '', keySkills: '', whyCompany: '' }); }}
                    className="text-cream/50 hover:text-cream/80 text-sm transition-colors"
                  >
                    Generate a new cover letter
                  </button>
                </div>
              </>
            )}
          </section>
        ) : (
          <>
            {/* Why Cover Letters Matter */}
            <section className="glass-light rounded-2xl p-8 mb-12">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
                Why You Need a Great Cover Letter
              </h2>
              <div className="space-y-4 text-cream/80">
                <p>
                  Many applicants skip the cover letter—or write a generic one. That's
                  your opportunity to stand out.
                </p>
                <ul className="space-y-2 ml-6">
                  <li>• You're changing careers or industries</li>
                  <li>• The role is highly competitive</li>
                  <li>• You have employment gaps to address</li>
                  <li>• You want to show genuine interest in the company</li>
                </ul>
              </div>
            </section>

            {/* Form */}
            <section className="glass-light rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
                Tell Us About the Opportunity
              </h2>

              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <label htmlFor="role" className="block text-cream/90 mb-2 font-medium">
                    Job Title <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                    placeholder="e.g. Care Worker, Security Officer"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-cream/90 mb-2 font-medium">
                    Company Name <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                    placeholder="e.g. NHS Trust, Care UK"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-cream/90 mb-2 font-medium">
                    Your Relevant Experience <span className="text-gold">*</span>
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all resize-none"
                    placeholder="Briefly describe your relevant experience, achievements, and qualifications..."
                  />
                </div>

                <div>
                  <label htmlFor="keySkills" className="block text-cream/90 mb-2 font-medium">
                    Key Skills (Optional)
                  </label>
                  <input
                    type="text"
                    id="keySkills"
                    name="keySkills"
                    value={formData.keySkills}
                    onChange={handleChange}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                    placeholder="e.g. Patient Care, Communication, First Aid"
                  />
                </div>

                <div>
                  <label htmlFor="whyCompany" className="block text-cream/90 mb-2 font-medium">
                    Why This Company? (Optional)
                  </label>
                  <textarea
                    id="whyCompany"
                    name="whyCompany"
                    value={formData.whyCompany}
                    onChange={handleChange}
                    rows={3}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all resize-none"
                    placeholder="What attracts you to this company or role?"
                  />
                </div>
              </div>
            </section>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  !formData.role ||
                  !formData.company ||
                  !formData.experience
                }
              >
                {isGenerating
                  ? 'Generating Your Cover Letter...'
                  : user
                  ? 'Generate Cover Letter'
                  : 'Sign in to Generate'}
              </Button>
              {!user && (
                <p className="text-cream/60 text-sm mt-4">
                  You'll need to sign in before generating
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
