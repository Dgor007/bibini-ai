# BIBINI - Professional CV Services Platform

A luxury Next.js 14 Progressive Web App (PWA) for CV services targeting African diaspora professionals. Built with Firebase, Stripe, and Resend.

## ✨ Features

- 🎨 **Luxury Bronze/Espresso Design** - Glass-morphism UI with warm, professional aesthetics
- 🔐 **Firebase Authentication** - Email/password, Google, and Apple sign-in
- 💳 **Stripe Payments** - Secure checkout for 5 services + bundle
- 📧 **Email Delivery** - Automated emails via Resend
- 📱 **PWA Ready** - Install as mobile/desktop app
- 🌍 **90+ Languages** - Multilingual support for global professionals

## 🚀 Services

1. **Signature CV Creation** (£39) - Voice-to-CV with AI processing
2. **Executive CV Revamp** (£29) - Elevate existing CVs
3. **AI Interview Practice** (£29) - Interactive practice sessions
4. **Interview Prep Guide** (£17.99) - Personalized PDF guide
5. **Custom Cover Letter** (£19) - Tailored cover letters
6. **Complete Career Package** (£99) - All 5 services (Save £34)

## 📦 Built With

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Payments**: Stripe
- **Email**: Resend
- **Icons**: Lucide React
- **Documents**: jsPDF, docx

## 📁 Project Structure

```
bibini-nextjs/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login page
│   ├── signup/page.tsx             # Signup page
│   ├── dashboard/page.tsx          # User dashboard
│   ├── voice-to-cv/page.tsx        # Voice-to-CV service
│   ├── cv-revamp/page.tsx          # CV Revamp service
│   ├── interview-ai/page.tsx       # Interview AI service
│   ├── interview-pdf/page.tsx      # Interview PDF service
│   ├── cover-letter/page.tsx       # Cover Letter service
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts   # Create Stripe session
│   │   │   └── webhook/route.ts    # Handle Stripe webhooks
│   │   └── email/
│   │       └── send/route.ts       # Send emails via Resend
│   └── globals.css                 # Global styles + design system
├── components/
│   ├── Header.tsx                  # Navigation header
│   ├── Footer.tsx                  # Footer with language info
│   ├── Button.tsx                  # Reusable button component
│   └── ServiceCard.tsx             # Service card component
├── lib/
│   ├── firebase.ts                 # Firebase configuration
│   └── stripe.ts                   # Stripe configuration
├── public/
│   └── manifest.json               # PWA manifest
├── .env.local.example              # Environment variables template
├── SETUP_CHECKLIST.md              # Detailed setup guide
└── README.md                       # You are here

```

## 🔧 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.local.example .env.local
```

Then fill in your API keys:
- **Firebase**: [console.firebase.google.com](https://console.firebase.google.com)
- **Stripe**: [dashboard.stripe.com](https://dashboard.stripe.com)
- **Resend**: [resend.com](https://resend.com)

See **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** for detailed configuration steps.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ✅ What's Complete

### Core Application
- ✅ Complete design system with luxury bronze/espresso theme
- ✅ Responsive layouts for all screen sizes
- ✅ PWA configuration with manifest

### Authentication
- ✅ Email/password signup and login
- ✅ Google OAuth integration
- ✅ Apple Sign In integration
- ✅ Protected routes
- ✅ User session management

### Pages (14 total)
- ✅ Landing page with services showcase
- ✅ Login page
- ✅ Signup page
- ✅ Dashboard with purchase history
- ✅ Voice-to-CV service page (with audio recording)
- ✅ CV Revamp service page (with file upload)
- ✅ Interview AI service page
- ✅ Interview PDF service page
- ✅ Cover Letter service page

### Components
- ✅ Header with navigation
- ✅ Footer with language support info
- ✅ Button with variants
- ✅ ServiceCard for displaying services

### Backend & APIs
- ✅ Firebase configuration (Auth, Firestore, Storage)
- ✅ Stripe checkout API route
- ✅ Stripe webhook handler
- ✅ Email sending API route (Resend)

### Documentation
- ✅ Comprehensive setup checklist
- ✅ Environment variable templates
- ✅ Inline TODO comments for configuration points
- ✅ Security rules examples

## 🔐 Security

- Firebase security rules configured for user-specific data access
- Stripe webhook signature verification implemented
- Environment variables for all sensitive keys
- HTTPS required for production (enforced by providers)

## 📱 PWA Features

- Offline-capable (with service worker)
- Installable on mobile and desktop
- App-like experience
- Custom icons and theme colors

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

### Other Platforms
Works with any platform supporting Next.js 14:
- Netlify
- AWS Amplify
- Google Cloud Run
- Railway

**Important**: Update these after deployment:
- Firebase authorized domains
- Stripe webhook endpoint URL
- Resend domain verification

## 📊 Next Steps (After Setup)

1. **Test Core Flows**
   - Sign up / Login
   - Browse services
   - Test Stripe checkout (use test cards)
   - Verify webhook handling

2. **Add Business Logic**
   - Implement CV generation from audio
   - Build PDF generation for guides
   - Create email templates
   - Add interview AI chat functionality

3. **Production Prep**
   - Add error tracking (Sentry)
   - Set up analytics
   - Configure backup systems
   - Add rate limiting
   - Performance optimization

## 🆘 Troubleshooting

See **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** for common issues and solutions.

## 📄 License

Private project for BIBINI Ltd.

---

**Built with ❤️ for African professionals worldwide**

🌍 Transforming career stories into global opportunities
