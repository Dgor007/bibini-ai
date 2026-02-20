'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generatePDF, generateWord } from '@/lib/document-generators';
import { sendDeliveryEmail } from '@/lib/send-email';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function InterviewPDFPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    industry: '',
    level: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [guide, setGuide] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.role || !formData.level) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-interview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setGuide(data.guide);

        await addDoc(collection(db, 'generated_cvs'), {
          userEmail: user.email,
          userName: user.displayName || 'User',
          cvContent: data.guide,
          service: 'Interview Prep Guide',
          country: 'UK',
          jobType: formData.role,
          wordCount: data.guide.split(/\s+/).length,
          createdAt: new Date(),
        });

        // Send delivery email
        sendDeliveryEmail({
          to: user.email,
          userName: user.displayName || 'there',
          service: 'Interview Prep Guide',
          content: data.guide,
        });
      } else {
        alert(data.error || 'Failed to generate guide. Please try again.');
      }
    } catch (error) {
      console.error('Error generating interview guide:', error);
      alert('Failed to generate guide. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const roleName = formData.role.replace(/-/g, '_');
    generatePDF(guide, `Interview_Prep_${roleName}.pdf`);
  };

  const handleDownloadWord = async () => {
    const roleName = formData.role.replace(/-/g, '_');
    await generateWord(guide, `Interview_Prep_${roleName}.docx`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-4xl">📄</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            Interview Prep Guide
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
            Get a comprehensive, personalized interview preparation guide tailored to
            your target role and company.
          </p>
          <div className="inline-block glass-light rounded-full px-6 py-2">
            <span className="text-gold font-serif text-3xl font-bold">£17.99</span>
          </div>
        </div>

        {/* Generated Result */}
        {guide ? (
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              Your Interview Prep Guide is Ready!
            </h2>
            <div className="bg-white/5 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
              <div className="text-cream/90 whitespace-pre-wrap text-sm leading-relaxed">
                {guide}
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
                onClick={() => { setGuide(''); setFormData({ role: '', company: '', industry: '', level: '' }); }}
                className="text-cream/50 hover:text-cream/80 text-sm transition-colors"
              >
                Generate another guide
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* What's Inside */}
            <section className="glass-light rounded-2xl p-8 mb-12">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
                What's Inside Your Guide
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-sm">📋</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">
                      50+ Role-Specific Questions
                    </h3>
                    <p className="text-cream/70 text-sm">
                      Common and challenging questions for your specific role and level
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-sm">💡</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">
                      Model Answers & Frameworks
                    </h3>
                    <p className="text-cream/70 text-sm">
                      STAR method examples and proven frameworks for structuring responses
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-sm">🎯</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">
                      Company Research Template
                    </h3>
                    <p className="text-cream/70 text-sm">
                      What to research and how to weave it into your answers
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-sm">❓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">
                      Questions to Ask Them
                    </h3>
                    <p className="text-cream/70 text-sm">
                      Smart questions that demonstrate your interest and research
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-sm">⚡</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">
                      Day-Before Checklist
                    </h3>
                    <p className="text-cream/70 text-sm">
                      Everything you need to prepare and review before interview day
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Form */}
            <section className="glass-light rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
                Personalize Your Guide
              </h2>

              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <label htmlFor="role" className="block text-cream/90 mb-2 font-medium">
                    Target Role <span className="text-gold">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full glass-light rounded-lg p-4 text-cream bg-transparent focus:outline-none focus:border-gold transition-all"
                  >
                    <option value="" className="bg-bgDarkest">
                      Select a role
                    </option>

                    {/* PRIMARY ROLES - Most Common */}
                    <option value="healthcare-care-worker" className="bg-bgDarkest">
                      Healthcare/Care Worker (NHS, care home, home carer)
                    </option>
                    <option value="nursing" className="bg-bgDarkest">
                      Nursing (registered nurse, healthcare assistant, student nurse)
                    </option>
                    <option value="security-officer" className="bg-bgDarkest">
                      Security Officer/Guard
                    </option>
                    <option value="hospitality-worker" className="bg-bgDarkest">
                      Hospitality Worker (hotel, restaurant, catering, kitchen)
                    </option>
                    <option value="retail-assistant" className="bg-bgDarkest">
                      Retail Assistant/Supervisor
                    </option>
                    <option value="customer-service" className="bg-bgDarkest">
                      Customer Service Representative/Call Center
                    </option>
                    <option value="warehouse-logistics" className="bg-bgDarkest">
                      Warehouse/Logistics (picker/packer, forklift, delivery driver)
                    </option>
                    <option value="cleaning-facilities" className="bg-bgDarkest">
                      Cleaning/Facilities (cleaner, janitor, facilities assistant)
                    </option>

                    {/* SECONDARY ROLES - Less Common But Relevant */}
                    <option value="construction-laborer" className="bg-bgDarkest">
                      Construction Worker/Laborer
                    </option>
                    <option value="admin-reception" className="bg-bgDarkest">
                      Admin/Reception
                    </option>
                    <option value="teaching-assistant" className="bg-bgDarkest">
                      Teaching Assistant/Childcare
                    </option>
                    <option value="transport-driver" className="bg-bgDarkest">
                      Transport (bus driver, taxi, Uber)
                    </option>
                    <option value="beauty-hair" className="bg-bgDarkest">
                      Beauty/Hair (barber, beautician, nail tech)
                    </option>
                    <option value="food-service" className="bg-bgDarkest">
                      Food Service (chef, kitchen porter, server)
                    </option>

                    <option value="other" className="bg-bgDarkest">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="company" className="block text-cream/90 mb-2 font-medium">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                    placeholder="e.g. Google, Microsoft, etc."
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-cream/90 mb-2 font-medium">
                    Industry (Optional)
                  </label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                    placeholder="e.g. Technology, Finance, Healthcare"
                  />
                </div>

                <div>
                  <label htmlFor="level" className="block text-cream/90 mb-2 font-medium">
                    Experience Level <span className="text-gold">*</span>
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    required
                    className="w-full glass-light rounded-lg p-4 text-cream bg-transparent focus:outline-none focus:border-gold transition-all"
                  >
                    <option value="" className="bg-bgDarkest">
                      Select level
                    </option>
                    <option value="entry" className="bg-bgDarkest">
                      Entry Level (0-2 years)
                    </option>
                    <option value="mid" className="bg-bgDarkest">
                      Mid Level (3-5 years)
                    </option>
                    <option value="senior" className="bg-bgDarkest">
                      Senior (6-10 years)
                    </option>
                    <option value="executive" className="bg-bgDarkest">
                      Executive (10+ years)
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.role || !formData.level}
              >
                {isGenerating
                  ? 'Generating Your Guide...'
                  : user
                  ? 'Generate My Interview Guide'
                  : 'Sign in to Generate'}
              </Button>
              {!user && (
                <p className="text-cream/60 text-sm mt-4">
                  You'll need to sign in before generating
                </p>
              )}
              {isGenerating && (
                <p className="text-cream/60 text-sm mt-4">
                  This may take 20-30 seconds...
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
