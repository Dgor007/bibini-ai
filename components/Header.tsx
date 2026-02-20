'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-serif text-3xl font-bold text-gold">
          BIBINI AI
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold text-sm font-bold">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user.displayName?.split(' ')[0] || 'Account'}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-xl z-50 py-2 border border-gold/20"
                  style={{ background: 'rgba(28,20,16,0.95)', backdropFilter: 'blur(20px)' }}
                >
                  <div className="px-4 py-2 border-b border-gold/10">
                    <p className="text-champagne text-sm font-medium truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-cream/50 text-xs truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-cream/80 hover:text-gold hover:bg-gold/5 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-cream/80 hover:text-gold hover:bg-gold/5 transition-colors"
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-cream/50 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <Link href="/login">
              <button className="btn-secondary">Login</button>
            </Link>
            <Link href="/signup">
              <button className="btn-primary">Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
