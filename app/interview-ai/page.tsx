'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authFetch } from '@/lib/api-client';
import { PRICES, STRIPE_PRICE_IDS } from '@/lib/stripe';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ─── Types ───────────────────────────────────────────────────────────
interface InterviewQuestion {
  question: string;
  category: string;
  tip: string;
}

interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  score?: number;
  feedback?: string;
  modelAnswer?: string;
  strongPoints?: string;
  improvementAreas?: string;
}

type SessionPhase =
  | 'landing'       // marketing page
  | 'setup'         // ask name + job
  | 'loading'       // generating questions
  | 'interview'     // voice Q&A loop
  | 'complete';     // session summary

// ─── Speech helpers ──────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.lang = 'en-GB';

  // Try to pick a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en-GB') && v.name.includes('Female')
  ) || voices.find((v) => v.lang.startsWith('en-GB'))
    || voices.find((v) => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

// ─── Component ───────────────────────────────────────────────────────
export default function InterviewAIPage() {
  const router = useRouter();

  // Auth & access
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Landing page selections
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Session state
  const [phase, setPhase] = useState<SessionPhase>('landing');
  const [userName, setUserName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [overallSummary, setOverallSummary] = useState('');

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [userTypedAnswer, setUserTypedAnswer] = useState('');

  // Refs
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef('');

  // ─── Auth listener + access check ─────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setCheckingAccess(true);
        try {
          const res = await authFetch('/api/documents/check-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: 'interview-ai' }),
          });
          const data = await res.json();
          setHasAccess(data.hasAccess === true);
        } catch {
          setHasAccess(false);
        } finally {
          setCheckingAccess(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  // Load voices (some browsers need this)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Check mic support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setMicSupported(false);
    }
  }, []);

  // ─── Speech Recognition ────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    finalTranscriptRef.current = '';
    setInterimText('');

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) finalTranscriptRef.current = final;
      setInterimText(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback((): string => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    const captured = interimText || finalTranscriptRef.current;
    setInterimText('');
    return captured.trim();
  }, [interimText]);

  // ─── AI speaks text + adds to transcript ───────────────────────────
  const aiSay = useCallback((text: string, extra?: Partial<TranscriptEntry>): Promise<void> => {
    return new Promise((resolve) => {
      setTranscript((prev) => [...prev, { role: 'ai', text, ...extra }]);
      setIsSpeaking(true);
      speak(text, () => {
        setIsSpeaking(false);
        resolve();
      });
    });
  }, []);

  // ─── Submit answer (voice or typed) ────────────────────────────────
  const submitAnswer = useCallback(async (answerText: string) => {
    if (!answerText.trim()) return;

    // Add user's answer to transcript
    setTranscript((prev) => [...prev, { role: 'user', text: answerText }]);
    setIsThinking(true);

    try {
      const currentQuestion = questions[currentQ];
      const qNum = currentQ + 1;
      const totalQ = questions.length;

      const res = await authFetch('/api/ai/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          role: jobTitle || selectedRole,
          question: currentQuestion.question,
          answer: answerText,
          questionNumber: qNum,
          totalQuestions: totalQ,
        }),
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.success) {
        if (data.score) setScores((prev) => [...prev, data.score]);

        // Speak feedback
        const feedbackText = `Score: ${data.score} out of 10. ${data.feedback}`;
        await aiSay(feedbackText, {
          score: data.score,
          feedback: data.feedback,
          modelAnswer: data.modelAnswer,
          strongPoints: data.strongPoints,
          improvementAreas: data.improvementAreas,
        });

        // Check if session is complete
        if (qNum >= totalQ) {
          setOverallSummary(data.overallSummary || `Great practice session! You completed all ${totalQ} questions.`);
          const summaryText = data.overallSummary || `Great practice session! You completed all ${totalQ} questions. Keep practising to improve your confidence.`;
          await aiSay(summaryText);
          setPhase('complete');
        } else {
          // Move to next question
          const nextIdx = currentQ + 1;
          setCurrentQ(nextIdx);
          const nextQ = questions[nextIdx];
          await aiSay(`Question ${nextIdx + 1}. ${nextQ.category}. ${nextQ.question}`);
        }
      } else {
        await aiSay('I had trouble evaluating that answer. Could you try again?');
      }
    } catch (error) {
      setIsThinking(false);
      console.error('Error evaluating answer:', error);
      await aiSay('Something went wrong. Please try answering again.');
    }
  }, [questions, currentQ, jobTitle, selectedRole, aiSay]);

  // ─── Handle mic button ─────────────────────────────────────────────
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      const captured = stopListening();
      if (captured) {
        submitAnswer(captured);
      }
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening, submitAnswer]);

  // ─── Handle typed answer submit ────────────────────────────────────
  const handleTypedSubmit = useCallback(() => {
    if (userTypedAnswer.trim()) {
      const answer = userTypedAnswer.trim();
      setUserTypedAnswer('');
      submitAnswer(answer);
    }
  }, [userTypedAnswer, submitAnswer]);

  // ─── Purchase handler ─────────────────────────────────────────────
  const handlePurchase = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setPurchasing(true);
    try {
      const response = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS.INTERVIEW_AI,
          userId: user.uid,
          service: 'interview-ai',
          metadata: { service: 'interview-ai' },
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [user, router]);

  // ─── Start practice session ────────────────────────────────────────
  const handleStartPractice = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasAccess) {
      handlePurchase();
      return;
    }
    if (!selectedRole || !selectedLevel) {
      alert('Please select both role and level.');
      return;
    }
    setPhase('setup');
    await aiSay("Hello! Welcome to your interview practice session. What's your name?");
  }, [user, router, selectedRole, selectedLevel, aiSay, hasAccess, handlePurchase]);

  // ─── Setup phase: collect name ─────────────────────────────────────
  const handleNameSubmit = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setUserName(name.trim());
    setTranscript((prev) => [...prev, { role: 'user', text: name.trim() }]);
    await aiSay(`Nice to meet you, ${name.trim()}! And what job are you applying for?`);
  }, [aiSay]);

  // ─── Setup phase: collect job title, then generate questions ───────
  const handleJobSubmit = useCallback(async (job: string) => {
    if (!job.trim()) return;
    setJobTitle(job.trim());
    setTranscript((prev) => [...prev, { role: 'user', text: job.trim() }]);
    setPhase('loading');
    await aiSay(`Great! I'll prepare some interview questions for a ${job.trim()} position. Give me a moment.`);

    try {
      const res = await authFetch('/api/ai/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-questions',
          role: job.trim(),
          level: selectedLevel,
        }),
      });

      const data = await res.json();

      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setCurrentQ(0);
        setPhase('interview');

        const firstQ = data.questions[0];
        await aiSay(
          `Alright ${userName || 'there'}, let's begin. I have ${data.questions.length} questions for you. Here's the first one. ${firstQ.category}. ${firstQ.question}`
        );
      } else {
        await aiSay("I had trouble generating questions. Let me try with some standard ones.");
        // Use fallback
        const fallback: InterviewQuestion[] = [
          { question: `Tell me about yourself and why you're interested in this ${job} role.`, category: 'Opening', tip: 'Keep it focused on relevant experience.' },
          { question: 'What relevant experience do you have?', category: 'Experience', tip: 'Use specific examples.' },
          { question: 'Describe a time you worked well in a team.', category: 'Behavioral', tip: 'Use the STAR method.' },
          { question: 'How do you handle pressure at work?', category: 'Situational', tip: 'Give a real example.' },
          { question: 'What are your key strengths for this role?', category: 'Competency', tip: 'Match strengths to the job.' },
          { question: 'Tell me about a challenge you overcame at work.', category: 'Behavioral', tip: 'Focus on your actions and the result.' },
          { question: 'Why should we hire you?', category: 'Closing', tip: 'Summarise your top strengths.' },
        ];
        setQuestions(fallback);
        setCurrentQ(0);
        setPhase('interview');
        await aiSay(`Let's begin. Question 1. ${fallback[0].question}`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      await aiSay("Something went wrong generating questions. Please try again.");
      setPhase('setup');
    }
  }, [selectedLevel, userName, aiSay]);

  // ─── New session ───────────────────────────────────────────────────
  const handleNewSession = () => {
    window.speechSynthesis?.cancel();
    setPhase('landing');
    setTranscript([]);
    setQuestions([]);
    setCurrentQ(0);
    setScores([]);
    setOverallSummary('');
    setUserName('');
    setJobTitle('');
    setInterimText('');
    setUserTypedAnswer('');
  };

  // ─── Computed ──────────────────────────────────────────────────────
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '0';

  // ─── RENDER: Landing page ─────────────────────────────────────────
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center">
              <span className="text-4xl">🎙️</span>
            </div>
            <h1 className="font-serif text-5xl font-bold text-champagne mb-4">
              AI Interview Practice
            </h1>
            <p className="text-xl text-cream/80 max-w-2xl mx-auto mb-6">
              Practice with our AI interviewer using your voice. Get real-time
              spoken feedback and walk into interviews with confidence.
            </p>
            <div className="inline-block glass-light rounded-full px-6 py-2">
              <span className="text-gold font-serif text-3xl font-bold">£29</span>
              <span className="text-cream/60 text-sm ml-2">Unlimited practice</span>
            </div>
          </div>

          {/* Features */}
          <section className="glass-light rounded-2xl p-8 mb-12">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              Voice-Based Interview Practice
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Voice Conversation', desc: 'AI speaks questions, you speak answers — just like a real interview' },
                { title: 'Instant Feedback', desc: 'Get scored on each answer with specific improvement tips' },
                { title: 'Role-Specific', desc: 'Questions tailored to your target job and experience level' },
                { title: 'Unlimited Sessions', desc: 'Practice as many times as you want. No limits.' },
              ].map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-champagne mb-1">{f.title}</h3>
                    <p className="text-cream/70 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Configuration */}
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6 text-center">
              Choose Your Industry
            </h2>
            <div className="max-w-lg mx-auto space-y-6">
              <div>
                <label htmlFor="role" className="block text-cream/90 mb-3 font-medium">
                  What role are you interviewing for?
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full glass-light rounded-lg p-4 text-cream bg-transparent focus:outline-none focus:border-gold transition-all"
                >
                  <option value="" className="bg-bgDarkest">Select a role</option>
                  <option value="healthcare-care-worker" className="bg-bgDarkest">Healthcare/Care Worker (NHS, care home, home carer)</option>
                  <option value="nursing" className="bg-bgDarkest">Nursing (registered nurse, healthcare assistant)</option>
                  <option value="security-officer" className="bg-bgDarkest">Security Officer/Guard</option>
                  <option value="hospitality-worker" className="bg-bgDarkest">Hospitality Worker (hotel, restaurant, catering)</option>
                  <option value="retail-assistant" className="bg-bgDarkest">Retail Assistant/Supervisor</option>
                  <option value="customer-service" className="bg-bgDarkest">Customer Service / Call Center</option>
                  <option value="warehouse-logistics" className="bg-bgDarkest">Warehouse/Logistics (picker, forklift, driver)</option>
                  <option value="cleaning-facilities" className="bg-bgDarkest">Cleaning/Facilities</option>
                  <option value="construction-laborer" className="bg-bgDarkest">Construction Worker/Laborer</option>
                  <option value="admin-reception" className="bg-bgDarkest">Admin/Reception</option>
                  <option value="teaching-assistant" className="bg-bgDarkest">Teaching Assistant/Childcare</option>
                  <option value="transport-driver" className="bg-bgDarkest">Transport (bus, taxi, Uber)</option>
                  <option value="beauty-hair" className="bg-bgDarkest">Beauty/Hair (barber, beautician, nail tech)</option>
                  <option value="food-service" className="bg-bgDarkest">Food Service (chef, kitchen porter, server)</option>
                  <option value="other" className="bg-bgDarkest">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-cream/90 mb-3 font-medium">
                  Experience level?
                </label>
                <select
                  id="level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full glass-light rounded-lg p-4 text-cream bg-transparent focus:outline-none focus:border-gold transition-all"
                >
                  <option value="" className="bg-bgDarkest">Select level</option>
                  <option value="entry" className="bg-bgDarkest">Entry Level (0-2 years)</option>
                  <option value="mid" className="bg-bgDarkest">Mid Level (3-5 years)</option>
                  <option value="senior" className="bg-bgDarkest">Senior (6-10 years)</option>
                  <option value="executive" className="bg-bgDarkest">Executive (10+ years)</option>
                </select>
              </div>

              <div className="glass-light rounded-lg p-6">
                <h3 className="font-semibold text-champagne mb-3">How It Works</h3>
                <ul className="space-y-2 text-cream/70 text-sm">
                  <li>1. AI asks your name and target job</li>
                  <li>2. AI generates 10-12 role-specific questions</li>
                  <li>3. AI speaks each question out loud</li>
                  <li>4. You answer using your microphone (or type)</li>
                  <li>5. AI gives spoken feedback and a score</li>
                  <li>6. Get your overall results at the end</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="text-center">
            {checkingAccess ? (
              <p className="text-cream/60 text-sm">Checking access...</p>
            ) : user && hasAccess === false ? (
              <>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="px-10 py-5 bg-gold hover:bg-gold-dark text-bgDarkest font-bold rounded-lg transition-all transform hover:scale-105 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Processing...' : `Unlock Interview Practice — £${PRICES.INTERVIEW_AI}`}
                </button>
                <p className="text-cream/60 text-sm mt-4">
                  One-time payment for unlimited practice sessions
                </p>
              </>
            ) : (
              <>
                <Button
                  onClick={handleStartPractice}
                  disabled={!selectedRole || !selectedLevel}
                >
                  {user ? 'Start Interview Practice' : 'Sign in to Start'}
                </Button>
                {!user && (
                  <p className="text-cream/60 text-sm mt-4">
                    You'll need to sign in before starting
                  </p>
                )}
              </>
            )}
            {!micSupported && (
              <p className="text-cream/60 text-sm mt-4">
                Voice input not supported in this browser. You can still type your answers.
              </p>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── RENDER: Practice session (setup / loading / interview / complete) ─
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full">
        {/* Progress bar (interview phase) */}
        {phase === 'interview' && (
          <div className="glass-light rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-cream/80 text-sm">
              Question {currentQ + 1} of {questions.length}
            </div>
            <div className="flex-1 mx-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
            {scores.length > 0 && (
              <div className="text-cream/80 text-sm">
                Avg: <span className="text-gold font-bold">{avgScore}/10</span>
              </div>
            )}
          </div>
        )}

        {/* Conversation transcript */}
        <div className="glass-light rounded-2xl p-6 mb-6 min-h-[300px] max-h-[450px] overflow-y-auto">
          <div className="space-y-4">
            {transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-4 ${
                  entry.role === 'user'
                    ? 'bg-gold/20 text-cream'
                    : 'bg-white/5 text-cream/90'
                }`}>
                  {entry.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gold font-semibold">AI Interviewer</span>
                      {isSpeaking && i === transcript.length - 1 && (
                        <span className="text-xs text-cream/40">Speaking...</span>
                      )}
                    </div>
                  )}
                  {entry.role === 'user' && (
                    <div className="text-xs text-cream/50 mb-1 text-right">You</div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>

                  {entry.score !== undefined && (
                    <div className="mt-3 pt-3 border-t border-cream/10 space-y-2">
                      <span className="text-gold font-bold">Score: {entry.score}/10</span>
                      {entry.strongPoints && (
                        <p className="text-xs text-green-400/80">Good: {entry.strongPoints}</p>
                      )}
                      {entry.improvementAreas && (
                        <p className="text-xs text-amber-400/80">Improve: {entry.improvementAreas}</p>
                      )}
                    </div>
                  )}
                  {entry.modelAnswer && (
                    <details className="mt-2">
                      <summary className="text-xs text-cream/40 cursor-pointer hover:text-cream/60">
                        View model answer
                      </summary>
                      <p className="text-xs text-cream/60 mt-1 leading-relaxed">{entry.modelAnswer}</p>
                    </details>
                  )}
                </div>
              </div>
            ))}

            {/* Interim speech text (while user is speaking) */}
            {isListening && interimText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl p-4 bg-gold/10 text-cream/60 border border-gold/20">
                  <div className="text-xs text-cream/40 mb-1 text-right">Listening...</div>
                  <p className="text-sm italic">{interimText}</p>
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-xs text-cream/40">Evaluating your answer...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {phase === 'loading' && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-xs text-cream/40">Preparing your questions...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* ─── Input area ─────────────────────────────────────────────── */}

        {/* Setup: collecting name */}
        {phase === 'setup' && !userName && (
          <SetupInput
            placeholder="Type your name..."
            onSubmit={handleNameSubmit}
            micSupported={micSupported}
          />
        )}

        {/* Setup: collecting job */}
        {phase === 'setup' && userName && !jobTitle && (
          <SetupInput
            placeholder="Type the job you're applying for..."
            onSubmit={handleJobSubmit}
            micSupported={micSupported}
          />
        )}

        {/* Interview: main voice/text input */}
        {phase === 'interview' && (
          <div className="space-y-4">
            {/* Tip */}
            {questions[currentQ]?.tip && (
              <div className="text-center">
                <span className="text-xs text-cream/40 italic">
                  Tip: {questions[currentQ].tip}
                </span>
              </div>
            )}

            {/* Mic button */}
            <div className="flex flex-col items-center gap-4">
              {micSupported && (
                <button
                  onClick={handleMicToggle}
                  disabled={isSpeaking || isThinking}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500/80 hover:bg-red-500 shadow-[0_0_0_0_rgba(239,68,68,0.7)] animate-[pulse-mic_1.5s_infinite]'
                      : isSpeaking || isThinking
                      ? 'bg-white/10 cursor-not-allowed opacity-50'
                      : 'bg-gold/20 hover:bg-gold/30 border-2 border-gold/50 hover:border-gold'
                  }`}
                >
                  {isListening ? (
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}
              <p className="text-cream/40 text-xs">
                {isListening
                  ? 'Listening... Click to stop and submit'
                  : isSpeaking
                  ? 'AI is speaking...'
                  : isThinking
                  ? 'Evaluating...'
                  : micSupported
                  ? 'Click to speak your answer'
                  : 'Type your answer below'}
              </p>
            </div>

            {/* Text fallback */}
            <div className="flex gap-3">
              <textarea
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTypedSubmit();
                  }
                }}
                rows={2}
                disabled={isSpeaking || isThinking || isListening}
                className="flex-1 glass-light rounded-lg p-3 text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-all resize-none text-sm"
                placeholder="Or type your answer here... (Enter to send)"
              />
              <button
                onClick={handleTypedSubmit}
                disabled={isSpeaking || isThinking || isListening || !userTypedAnswer.trim()}
                className="px-5 py-2 bg-gold hover:bg-gold-dark disabled:opacity-40 text-bgDarkest font-semibold rounded-lg transition-colors self-end text-sm"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Complete: session summary */}
        {phase === 'complete' && (
          <div className="glass-light rounded-2xl p-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-4">
              Session Complete!
            </h2>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-3xl font-bold text-gold">{avgScore}/10</div>
                <div className="text-cream/60 text-sm">Average Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-champagne">{scores.length}</div>
                <div className="text-cream/60 text-sm">Questions Answered</div>
              </div>
            </div>
            {overallSummary && (
              <p className="text-cream/80 text-sm mb-6 max-w-md mx-auto">{overallSummary}</p>
            )}
            <p className="text-cream/60 text-sm mb-6">
              {Number(avgScore) >= 7
                ? "Excellent performance! You're well-prepared."
                : Number(avgScore) >= 5
                ? "Good effort! A bit more practice and you'll nail it."
                : "Keep practising! Review the model answers above and try again."}
            </p>
            <button
              onClick={handleNewSession}
              className="px-8 py-3 bg-gold hover:bg-gold-dark text-bgDarkest font-semibold rounded-lg transition-colors"
            >
              Practice Again
            </button>
          </div>
        )}
      </div>

      <Footer />

      {/* Pulse mic animation */}
      <style jsx>{`
        @keyframes pulse-mic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}

// ─── Setup input sub-component (name / job collection) ───────────────
function SetupInput({
  placeholder,
  onSubmit,
  micSupported,
}: {
  placeholder: string;
  onSubmit: (value: string) => void;
  micSupported: boolean;
}) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const finalRef = useRef('');

  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-GB';
    finalRef.current = '';

    rec.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current = text;
      }
      setValue(text);
    };
    rec.onend = () => {
      setListening(false);
      const captured = finalRef.current || value;
      if (captured.trim()) onSubmit(captured.trim());
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <div className="flex gap-3 items-end">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value.trim());
            setValue('');
          }
        }}
        className="flex-1 glass-light rounded-lg p-4 text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-all text-sm"
        placeholder={placeholder}
        autoFocus
      />
      {micSupported && (
        <button
          onClick={startMic}
          disabled={listening}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            listening
              ? 'bg-red-500/80 animate-pulse'
              : 'bg-gold/20 hover:bg-gold/30 border border-gold/50'
          }`}
        >
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
      <button
        onClick={() => {
          if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
          }
        }}
        disabled={!value.trim()}
        className="px-5 py-3 bg-gold hover:bg-gold-dark disabled:opacity-40 text-bgDarkest font-semibold rounded-lg transition-colors text-sm"
      >
        Send
      </button>
    </div>
  );
}
