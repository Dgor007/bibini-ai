import Link from 'next/link';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-gold/30 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-gold/50"></div>
        </div>
        <h1 className="font-serif text-7xl font-bold text-champagne mb-4">BIBINI AI</h1>
        <h2 className="font-serif text-5xl text-cream mb-4">Where African Talent<br/>Meets Global Opportunity</h2>
        <div className="w-48 h-0.5 bg-gold mx-auto my-6"></div>
        <p className="text-xl text-cream/90 max-w-2xl mx-auto mb-12">We transform your story into a world-class professional presence.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup"><button className="btn-primary">Get Started</button></Link>
          <a href="#services"><button className="btn-secondary">View Services</button></a>
        </div>
      </section>

      {/* Story Block */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="glass-light rounded-2xl p-12 text-center">
          <h3 className="font-serif text-3xl font-bold text-champagne mb-6">Your Story Deserves Global Recognition</h3>
          <p className="text-lg text-cream/90 mb-6">Too many brilliant professionals are overlooked because their experience isn't packaged for international standards.</p>
          <p className="text-lg text-cream/90 mb-8">At BIBINI AI, we bridge that gap—translating your journey into opportunity.</p>
          <div className="w-24 h-px bg-gold/50 mx-auto my-8"></div>
          <div className="flex justify-center gap-12">
            <div><div className="font-serif text-4xl font-bold text-gold mb-2">400+</div><div className="text-sm text-cream/70">World-Class CVs</div></div>
            <div className="w-px h-16 bg-gold/30"></div>
            <div><div className="font-serif text-4xl font-bold text-gold mb-2">15+</div><div className="text-sm text-cream/70">Countries Served</div></div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="font-serif text-5xl font-bold text-champagne text-center mb-16">Our Signature Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard icon="🎤" title="Voice-to-CV" price="£39" href="/voice-to-cv" />
          <ServiceCard icon="✨" title="CV Revamp" price="£29" href="/cv-revamp" />
          <ServiceCard icon="💬" title="AI Interview Practice" price="£29" href="/interview-ai" />
          <ServiceCard icon="📄" title="Interview Prep Guide" price="£17.99" href="/interview-pdf" />
          <ServiceCard icon="✉️" title="Cover Letter Generator" price="£19" href="/cover-letter" />
          <div className="rounded-2xl p-8" style={{ border: '2px solid #C6A15B', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <span className="text-4xl mb-4 block">🎁</span>
            <h3 className="font-serif text-2xl font-bold text-champagne mb-3">Complete Career Package</h3>
            <p className="text-gold font-serif text-2xl mb-4">£99</p>
            <p className="text-cream/80 mb-6">All 5 services (Save £34). The ultimate toolkit for your career.</p>
            <Link href="/bundle"><button className="w-full py-3 font-semibold rounded-lg" style={{ backgroundColor: '#C6A15B', color: '#1a1a2e' }}>Get Bundle</button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
