'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    setProfileMessage('');

    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setProfileMessage('Profile updated successfully.');
    } catch {
      setProfileMessage('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const isEmailUser = user?.providerData?.some(
    (p: any) => p.providerId === 'password'
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      // Re-authenticate before password change
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-gold/30 border-t-gold animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <h1 className="font-serif text-4xl font-bold text-champagne mb-2">
          Account Settings
        </h1>
        <p className="text-cream/70 mb-10">{user?.email}</p>

        {/* Profile Section */}
        <section className="glass-light rounded-2xl p-8 mb-8">
          <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
            Profile
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-cream/90 mb-2 font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-cream/90 mb-2 font-medium">Email</label>
              <div className="w-full glass-light rounded-lg p-4 text-cream/50">
                {user?.email}
              </div>
              <p className="text-cream/40 text-xs mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-cream/90 mb-2 font-medium">Sign-in Method</label>
              <div className="w-full glass-light rounded-lg p-4 text-cream/60 text-sm">
                {user?.providerData?.map((p: any) => {
                  if (p.providerId === 'google.com') return 'Google';
                  if (p.providerId === 'apple.com') return 'Apple';
                  if (p.providerId === 'password') return 'Email & Password';
                  return p.providerId;
                }).join(', ')}
              </div>
            </div>

            {profileMessage && (
              <p className={`text-sm ${profileMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {profileMessage}
              </p>
            )}

            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </section>

        {/* Password Section - Only for email/password users */}
        {isEmailUser && (
          <section className="glass-light rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-2xl font-bold text-champagne mb-6">
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-cream/90 mb-2 font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-cream/90 mb-2 font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-cream/90 mb-2 font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full glass-light rounded-lg p-4 text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-all"
                  placeholder="Re-enter new password"
                />
              </div>

              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="text-green-400 text-sm">{passwordMessage}</p>
              )}

              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
