'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { generatePDF, generateWord } from '@/lib/document-generators';
import { sendDeliveryEmail } from '@/lib/send-email';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function VoiceToCVPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (!selectedCountry || !selectedJobType) {
      alert('Please select both country and job type before recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const textToUse = transcript.trim();

    if (!audioBlob && !textToUse) {
      alert('Please record your career story or type it below.');
      return;
    }

    setIsGenerating(true);

    try {
      // If we have audio but no transcript, use the Web Speech API to transcribe
      // For now, we use the typed transcript or a placeholder
      let cvTranscript = textToUse;

      if (!cvTranscript && audioBlob) {
        // Attempt browser-based speech recognition on the audio
        // Fallback: prompt user to also type their story
        alert('Please also type or paste your career story in the text box below. Voice-only transcription coming soon.');
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/ai/generate-cv-from-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cvTranscript,
          userName: user.displayName || 'Applicant',
          userEmail: user.email,
          country: selectedCountry,
          jobType: selectedJobType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedCV(data.cv);

        // Send delivery email
        sendDeliveryEmail({
          to: user.email,
          userName: user.displayName || 'there',
          service: 'Voice-to-CV',
          content: data.cv,
        });
      } else {
        alert(data.error || 'Failed to generate CV. Please try again.');
      }
    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Failed to generate CV. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const name = user?.displayName?.replace(/\s+/g, '_') || 'CV';
    generatePDF(generatedCV, `${name}_Voice_CV.pdf`);
  };

  const handleDownloadWord = async () => {
    const name = user?.displayName?.replace(/\s+/g, '_') || 'CV';
    await generateWord(generatedCV, `${name}_Voice_CV.docx`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-4xl">🎤</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
            Voice-to-CV
          </h1>
          <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
            Tell us your career story in your own voice. We'll transform it into a
            world-class professional CV that opens doors.
          </p>
          <div className="inline-block glass-light rounded-full px-6 py-2">
            <span className="text-gold font-serif text-3xl font-bold">£39</span>
          </div>
        </div>

        {/* Generated Result */}
        {generatedCV ? (
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              Your CV is Ready!
            </h2>
            <div className="bg-white/5 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
              <div className="text-cream/90 whitespace-pre-wrap text-sm leading-relaxed">
                {generatedCV}
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
                onClick={() => {
                  setGeneratedCV('');
                  setTranscript('');
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="text-cream/50 hover:text-cream/80 text-sm transition-colors"
              >
                Create another CV
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* How It Works */}
            <section className="glass-light rounded-2xl p-8 mb-12">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-champagne mb-2">Record Your Story</h3>
                  <p className="text-cream/70 text-sm">
                    Speak naturally about your experience, skills, and achievements in any
                    of 90+ languages.
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-champagne mb-2">AI Processing</h3>
                  <p className="text-cream/70 text-sm">
                    Our AI analyzes your story and structures it according to international
                    standards.
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-champagne mb-2">Receive Your CV</h3>
                  <p className="text-cream/70 text-sm">
                    Get a polished, ATS-friendly CV in both PDF and Word format instantly.
                  </p>
                </div>
              </div>
            </section>

            {/* Country & Job Type Selection */}
            <section className="glass-light rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
                Tell Us About Your Job Search
              </h2>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div>
                  <label className="block text-champagne font-semibold mb-3">
                    Where are you applying for jobs?
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-bgDark border border-gold/30 text-champagne focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">Select country...</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-champagne font-semibold mb-3">
                    What type of work are you looking for?
                  </label>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-bgDark border border-gold/30 text-champagne focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">Select job type...</option>
                    <option value="Healthcare/NHS">Healthcare/NHS</option>
                    <option value="Care Work">Care Work</option>
                    <option value="Tech/IT">Tech/IT</option>
                    <option value="Security">Security</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {(!selectedCountry || !selectedJobType) && (
                <p className="text-center text-cream/60 text-sm mt-6">
                  Please select both country and job type before recording
                </p>
              )}
            </section>

            {/* Recording Section */}
            <section className="glass-light rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
                Record Your Career Story
              </h2>

              <div className="flex flex-col items-center">
                {/* Recording Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all mb-6 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-gold hover:bg-gold-dark'
                  }`}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 bg-white rounded"></div>
                  ) : (
                    <svg
                      className="w-12 h-12 text-bgDarkest"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  )}
                </button>

                {/* Timer */}
                <div className="text-center mb-6">
                  {isRecording && (
                    <p className="text-cream/60 text-sm mb-2">Recording...</p>
                  )}
                  <p className="text-champagne font-mono text-2xl">
                    {formatTime(recordingTime)}
                  </p>
                  {!isRecording && audioBlob && (
                    <p className="text-green-400 text-sm mt-2">Recording saved</p>
                  )}
                </div>

                {/* Text input for transcript */}
                <div className="w-full max-w-lg mb-6">
                  <label className="block text-cream/90 mb-2 font-medium">
                    Or type/paste your career story below
                  </label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={8}
                    className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all resize-none text-sm"
                    placeholder="Tell us about your work experience, skills, education, achievements, and career goals..."
                  />
                </div>

                {/* Instructions */}
                <div className="w-full max-w-md glass-light rounded-lg p-6">
                  <h3 className="font-semibold text-champagne mb-3">What to include:</h3>
                  <ul className="space-y-2 text-cream/70 text-sm">
                    <li>Your current and previous roles</li>
                    <li>Key achievements and responsibilities</li>
                    <li>Skills and expertise</li>
                    <li>Education and certifications</li>
                    <li>Career goals and aspirations</li>
                  </ul>
                  <p className="text-cream/60 text-xs mt-4">
                    Aim for 3-5 minutes if recording. Speak clearly and take your time.
                  </p>
                </div>
              </div>
            </section>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!audioBlob && !transcript.trim())}
              >
                {isGenerating
                  ? 'Generating Your CV...'
                  : user
                  ? 'Generate My CV'
                  : 'Sign in to Generate'}
              </Button>
              {!user && (
                <p className="text-cream/60 text-sm mt-4">
                  You'll need to sign in before generating
                </p>
              )}
              {isGenerating && (
                <p className="text-cream/60 text-sm mt-4">
                  This may take 15-20 seconds...
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
