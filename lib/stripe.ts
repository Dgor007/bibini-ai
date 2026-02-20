import { loadStripe, Stripe } from '@stripe/stripe-js';

// TODO: Add your Stripe publishable key to .env.local
// 1. Go to Stripe Dashboard: https://dashboard.stripe.com/
// 2. Go to Developers > API keys
// 3. Copy the "Publishable key" (starts with pk_)
// 4. Add to .env.local as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Service prices (in GBP)
export const PRICES = {
  VOICE_TO_CV: 39,
  CV_REVAMP: 29,
  INTERVIEW_AI: 29,
  INTERVIEW_PDF: 17.99,
  COVER_LETTER: 19,
  BUNDLE: 99,
};

// TODO: Create products in Stripe Dashboard and add price IDs here
// 1. Go to Stripe Dashboard > Products
// 2. Create a product for each service
// 3. Set the price in GBP
// 4. Copy the Price ID (starts with price_)
// 5. Add to .env.local
export const STRIPE_PRICE_IDS = {
  VOICE_TO_CV: process.env.NEXT_PUBLIC_STRIPE_PRICE_VOICE_TO_CV || '',
  CV_REVAMP: process.env.NEXT_PUBLIC_STRIPE_PRICE_CV_REVAMP || '',
  INTERVIEW_AI: process.env.NEXT_PUBLIC_STRIPE_PRICE_INTERVIEW_AI || '',
  INTERVIEW_PDF: process.env.NEXT_PUBLIC_STRIPE_PRICE_INTERVIEW_PDF || '',
  COVER_LETTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_COVER_LETTER || '',
  BUNDLE: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE || '',
};
