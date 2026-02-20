/**
 * TEMPLATE-BASED CV GENERATION
 * Uses real human CV examples that scored 100% human on GPTZero
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Note: API key check removed for module loading - will be validated at runtime
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Real CV examples that scored 100% human on GPTZero
const HUMAN_CV_EXAMPLES = {
  dennis_construction: `
DENNIS AMPONSAH
3B Chesterton Road, London, W10 5LY · 07740 047147
Email: dennisamponsah112@icloud.com

SUMMARY
Energetic and self-motivated Construction Manager involved in all facets of building construction from
pre-construction to hand over. Proactive and experienced in managing construction teams and sub-
contractors on projects. Successful in creating effective communication between personnel, general
contractors and the management team. Safety orientated, consistently monitors site works to ensure
proper compliance with building and safety codes.

EXPERIENCE
Current:
Logistics/ Site Manager Collins Construction – London
Coordination of sub-contractors on site.
Implementation of all company safety and quality procedures
Act as liaison with company safety representatives to promote awareness and understanding of safety
protocols, procedures and initiatives
Ensure compliance with plans, drawings and specifications
Manage teams of on site general contractors from groundwork, general construction to fit out and
handover
Consistently assuming additional responsibilities and hours to achieve programme deadlines

Owner/Operator: Wing Ting London
Established a successful catering business from initial concept at several locations over a period of 2
years
Management, hiring and training of staff
Budgeting and Business development working closely with financial teams to ensure profit margins were
managed effectively
Responsible for all marketing and advertising including web promotions and social media accounts

Manager: Costa Coffee - Shelby
Managing staff and store including inventory, cash register and daily targets, meal preparation, hygiene
maintenance and serving customers.
`,

  guillaume_outplacement: `
SUMMARY
I can define myself as having too many ideas for a single life :)

After a start of career in the recruitment industry in Paris, Dublin and then Lausanne, I decided to launch my own service company in 2013 at the age of 29. Strangely, it wasn't a recruitment company, but an outplacement firm based in Geneva. I still have a strong interest in recruitment, but now, I prefer to share my experience in recruitment and entrepreneurship with our outplacement participants.

I find it to be much more rewarding (not in terms of cash but in terms of human-based experience)!

I had the chance to work with Gregore in Lausanne in 2011, when I was launching a recruitment firm in Lausanne, and Gregoire accepted to join me in this new outplacement challenge in 2017.
`,

  bizdev_sales: `
SUMMARY
Adaptable and multidisciplined Sales Leader with proven experience building, defining, and managing sales operations across a range of products and services in competitive industries. Leverages growth-focused mindset and endless tenacity to achieve record targets, revenue, and performance at each stage of the sales funnel for B2B and B2C services. Gifted communicator who leads and empowers diverse teams while coordinating with clients from all backgrounds to cultivate mutually beneficial relationships.

EXPERIENCE
Business Development Manager
Brought on to build, establish and define entirety of company's lead generation, top of sales funnel, and go-to-market (GTM) processes at the late-stage startup phase to grow and expand accounts across the US
Maximize performance of sales development representatives (SDRs) and newly established lead generation team by leading coaching and upskilling sessions on best practices for developing and managing accounts
Spearhead all account-based management programs including multichannel direct mail, email, and video marketing
Liaise with client business owners and executives at each stage of sales lifecycle
Consistently scope and identify opportunities to improve business and create opportunities.
•
Spearheaded the systems that led to sales team salespipeline of 519 booked meetings that enabled the company to go from $1.7 to 3.7M in Annual Recurring Revenue - 116 % growth
Exceeded lead pipeline generation/meetings booked goal by 190%
Enhanced operations by planning, building out, and implementing all lead generation functions, practices, and playbook within 30 days of hire.
Unified sales model while promoting founder's philosophy by organizing program that supported 20-25 product demonstrations a month.
`,
};

export async function generateCVFromVoiceWithTemplates(params: {
  transcript: string;
  userName: string;
  userEmail: string;
  phone?: string;
  location?: string;
  country?: string;
  jobType?: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.9, // Higher for more variation
      topK: 50,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  const prompt = `**CRITICAL TASK: Generate a CV that passes AI detection tools as 100% HUMAN-WRITTEN**

I'm going to show you 3 REAL CVs that scored 100% HUMAN on GPTZero AI detector. Your job is to write a NEW CV in the EXACT SAME STYLE as these examples.

**EXAMPLE CV #1 - Dennis (Construction Manager) - 100% HUMAN on GPTZero:**
${HUMAN_CV_EXAMPLES.dennis_construction}

**EXAMPLE CV #2 - Guillaume (Career Services) - 100% HUMAN on GPTZero:**
${HUMAN_CV_EXAMPLES.guillaume_outplacement}

**EXAMPLE CV #3 - Business Development Manager - 100% HUMAN on GPTZero:**
${HUMAN_CV_EXAMPLES.bizdev_sales}

**WHAT MAKES THESE CVs SCORE 100% HUMAN:**
1. **Inconsistent formatting** - Dennis mixes paragraph descriptions with bullet points
2. **Simple, direct language** - "working closely with", "responsible for all", "involved in"
3. **Natural imperfections** - Some bullets have periods, some don't. Not perfectly structured.
4. **Real job progression** - Shows actual career changes with context
5. **Personal voice** - Guillaume uses "I can define myself", emoticons :), parenthetical asides
6. **Mix of styles** - Not every section formatted the same way
7. **Conversational tone** - Sounds like a person describing their work, not a marketing document

**YOUR TASK:**
Write a CV for ${params.userName} using their voice transcript below. COPY the style of the examples above.

**Person's Information:**
Name: ${params.userName}
Email: ${params.userEmail}
${params.phone ? `Phone: ${params.phone}` : ''}
${params.location ? `Location: ${params.location}` : ''}
${params.country ? `Target Country: ${params.country}` : ''}
${params.jobType ? `Job Type: ${params.jobType}` : ''}

**Their Voice Transcript:**
${params.transcript}

**CRITICAL INSTRUCTIONS:**
1. **Copy Dennis's format:** Mix paragraph descriptions with bullet points (not all bullets!)
2. **Use simple verbs:** "working closely with", "responsible for", "managing", "ensuring", "involved in"
3. **BE INCONSISTENT:** Some bullets end with periods, some don't. Mix it up naturally.
4. **Sound human:** Write like the person is describing their actual job, not writing marketing copy
5. **No AI words:** NEVER use: spearheaded, leveraged, orchestrated, optimized, streamlined, facilitated, synergized
6. **Real numbers:** Use actual numbers from transcript, or leave them out - don't invent perfect percentages

**FORMAT (copy Dennis's style):**

${params.userName}
${params.userEmail}${params.phone ? ` | ${params.phone}` : ''}${params.location ? ` | ${params.location}` : ''}

SUMMARY
[Write 3-4 sentences like Dennis's summary. Use phrases like "involved in all facets of", "working closely with", "responsible for". Make it simple and direct.]

SKILLS & CERTIFICATIONS
[Simple bullet list of skills, certs, qualifications]

EXPERIENCE

[Job Title] | [Company] | [Location] | [Dates]
[Mix of paragraph description and bullets, like Dennis does. Some jobs can be just a paragraph. Others can have bullets. DON'T make every job look identical!]

[Another Job]
[Use different format than the first job - maybe just bullets, or just a paragraph]

EDUCATION
[Simple format - Qualification | Institution | Year]

**REMEMBER:** The goal is to write like a REAL PERSON wrote this CV, not like AI. Be slightly messy, inconsistent, and natural. That's what makes it human!

Generate the CV now:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
