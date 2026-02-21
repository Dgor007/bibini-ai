import { PRICES, STRIPE_PRICE_IDS } from './stripe';

const SERVICE_KEY_MAP: Record<string, keyof typeof PRICES> = {
  'Voice-to-CV': 'VOICE_TO_CV',
  'voice-to-cv': 'VOICE_TO_CV',
  'CV Revamp': 'CV_REVAMP',
  'cv-revamp': 'CV_REVAMP',
  'Cover Letter': 'COVER_LETTER',
  'cover-letter': 'COVER_LETTER',
  'Interview Prep Guide': 'INTERVIEW_PDF',
  'interview-pdf': 'INTERVIEW_PDF',
  'AI Interview Practice': 'INTERVIEW_AI',
  'interview-ai': 'INTERVIEW_AI',
};

export function getPriceForService(service: string): number {
  const key = SERVICE_KEY_MAP[service];
  return key ? PRICES[key] : 0;
}

export function getStripePriceIdForService(service: string): string {
  const key = SERVICE_KEY_MAP[service];
  return key ? STRIPE_PRICE_IDS[key] : '';
}
