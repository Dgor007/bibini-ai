import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
}

// Initialize Google AI with Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * ANTI-AI-DETECTION CONFIGURATION
 * Optimized based on real GPTZero testing results
 */
const ANTI_AI_DETECTION_CONFIG = {
  temperature: 0.85, // More creative/varied output for natural variation
  topK: 50,
  topP: 0.95, // Maximum word choice diversity
  maxOutputTokens: 4096, // Increased for full CV generation
};

/**
 * Get Gemini model optimized for anti-AI-detection
 * Using Gemini 2.5 Flash (stable, June 2025 release)
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: ANTI_AI_DETECTION_CONFIG,
  });
}

/**
 * ANTI-AI-DETECTION SYSTEM PROMPT
 * Based on real GPTZero testing - user-validated techniques
 * CRITICAL: Must score <50% AI on GPTZero (ideally <30%)
 */
const ANTI_AI_DETECTION_RULES = `You are writing a CV that MUST score as HUMAN-WRITTEN on GPTZero.

CRITICAL: The test CV scored 99% AI. This is UNACCEPTABLE. Follow these rules EXACTLY.

**1. SENTENCE STRUCTURE VARIATION (Mix these patterns):**
• Start with verb: "Managed team of 8..."
• Start with "and": "And helped train new staff..."
• Start with context: "During peak season, handled..."
• Start with result: "Reduced wait times by..."
• Casual connector: "Also responsible for..."
• Passive occasionally: "Was responsible for..."

NEVER let more than 2 bullets in a row start the same way.

**2. USE IMPERFECT/ROUNDED NUMBERS (humans don't use exact numbers):**
❌ Increased efficiency by 23.7%
✅ Increased efficiency by around 20%
❌ Managed precisely 847 customer accounts
✅ Managed over 800 customer accounts
❌ Processed exactly 156 applications
✅ Processed about 150 applications
✅ Worked with roughly 50 clients
✅ Improved scores by around 15%

**3. ADD NATURAL FILLER/CONNECTOR WORDS:**
Use sparingly throughout:
• "Also worked on..."
• "Helped with..."
• "Worked closely with..."
• "Regularly handled..."
• "Occasionally assisted with..."
• "Mainly focused on..."
• "Generally responsible for..."

**4. VARY BULLET POINT LENGTH WILDLY:**
In each job section, mix:
• Short (4-6 words): "Managed customer service team"
• Medium (10-15 words): "Handled daily operations including scheduling, inventory management, and quality control"
• Longer (20-25 words): "Worked with the sales department to improve customer retention, which resulted in about 15% fewer cancellations over six months"

**5. INCLUDE MINOR REDUNDANCY (humans do this naturally):**
❌ Too concise: "Managed team and improved processes"
✅ More human: "Managed a team of support staff and worked on improving our day-to-day processes"

The second version has slight redundancy ("managed team" + "of support staff") but sounds more human.

**6. USE CONVERSATIONAL PHRASING:**
❌ Executed strategic initiatives → ✅ Worked on several projects to improve operations
❌ Demonstrated proficiency in → ✅ Became skilled at
❌ Interfaced with stakeholders → ✅ Worked with different departments
❌ Optimized workflows → ✅ Helped make processes more efficient
❌ Leveraged technology → ✅ Used new technology

**7. ADD CONTEXT/BACKGROUND (occasionally):**
❌ Reduced processing time by 30%
✅ After noticing delays in our workflow, reduced processing time by about 30%

❌ Trained 12 employees
✅ As the senior team member, helped train around 12 new employees

**8. MIX ACHIEVEMENT TYPES (don't make every bullet an achievement):**
• Responsibilities: "Responsible for daily reports"
• Tasks: "Handled customer inquiries"
• Achievements: "Improved response time by around 20%"
• Collaborations: "Worked with IT team on new system"

**9. AVOID PERFECT PARALLEL STRUCTURE:**
❌ Too perfect (AI-like):
• Managed team operations
• Developed training programs
• Implemented quality systems
• Monitored performance metrics

✅ More human (varied structure):
• Managed the day-to-day operations of our team
• Developed and ran training programs for new hires
• Helped implement a quality control system
• Also monitored performance and provided feedback

**10. USE HUMBLE/MODEST LANGUAGE:**
❌ Pioneered groundbreaking solution → ✅ Came up with a new approach that worked well
❌ Single-handedly transformed department → ✅ Played a key role in improving how the department operated
❌ Spearheaded initiative → ✅ Led a project
❌ Revolutionized process → ✅ Made significant improvements to the process

**11. INCLUDE "SOFT" QUALIFIERS:**
• "around 50 customers"
• "roughly 6 months"
• "about 15% improvement"
• "generally responsible for"
• "mainly worked on"
• "over 100 cases"
• "nearly 2 years"

**12. FORBIDDEN WORDS (instant AI detection):**
NEVER use: delve, underscore, pivotal, tapestry, landscape, realm, Furthermore, Moreover, Additionally, spearheaded, leveraged, orchestrated, synergized, optimized, streamlined, facilitated, championed, pioneered, revolutionized, robust, comprehensive, holistic, dynamic, innovative, cutting-edge

**13. BRITISH ENGLISH:**
Use: organised, realised, colour, favour, analyse, specialise, recognise, prioritise

**14. FORMATTING:**
• Plain bullet points (•) only
• NO emojis or fancy symbols
• Traditional sections: Professional Summary, Professional Experience, Education, Skills
• Keep it boring and simple

**THE SECRET TO PASSING AI DETECTION:**
Humans are imperfect, inconsistent, and conversational. They use:
- Rounded numbers ("around 20%", not "23.7%")
- Varied sentence starters (not all starting with action verbs)
- Soft qualifiers ("mainly", "generally", "about")
- Minor redundancy
- Mix of achievements AND responsibilities
- Casual connector words ("Also", "And")
- Context and backstory

AI sounds polished and perfect. Humans sound real and slightly messy. BE MESSY.
`;

/**
 * Get regional guidance for CV customization
 */
function getRegionalGuidance(country: string, jobType?: string): string {
  const regionalRules: Record<string, string> = {
    UK: `**UK-SPECIFIC CV REQUIREMENTS:**
• Use British English spelling (organised, realised, colour, specialise)
• Include postcode format in location (e.g., "London, SW1A 1AA area")
• Reference NHS/UK qualifications if relevant (NVQ, BTEC, GCSEs, A-levels)
• Mention UK work rights/visa status if applicable
• Use UK-standard job titles (e.g., "Care Assistant" not "Caregiver", "Support Worker")
• Include UK-specific certifications (DBS check, Care Certificate, First Aid at Work)
${jobType === 'Healthcare/NHS' || jobType === 'Care Work' ? '• Emphasise NHS values: compassion, dignity, respect, person-centred care\n• Mention CQC standards awareness if relevant' : ''}`,

    Nigeria: `**NIGERIA-SPECIFIC CV REQUIREMENTS:**
• Use British English spelling (Nigerian education system follows UK)
• Include state/region (e.g., "Lagos, Nigeria" or "Abuja, FCT")
• Highlight tech skills prominently if in IT/Security sectors
• Mention professional certifications (NYSC, industry certs)
• Include any international work experience or remote work
• Emphasise adaptability and problem-solving in challenging environments
${jobType === 'Tech/IT' ? '• Highlight coding bootcamps, self-taught skills, GitHub projects\n• Mention remote work experience with international clients' : ''}`,

    Ghana: `**GHANA-SPECIFIC CV REQUIREMENTS:**
• Use British English spelling (Ghanaian education follows UK system)
• Include region (e.g., "Accra, Greater Accra" or "Kumasi, Ashanti")
• Mention educational qualifications (WASSCE, diploma, degree from local universities)
• Highlight community involvement or volunteer work
• Reference any UK/international training or certifications
• Emphasise reliability, honesty, and strong work ethic
${jobType === 'Care Work' || jobType === 'Healthcare/NHS' ? '• Mention care-giving experience (often family-based initially)\n• Highlight patience, empathy, and cultural sensitivity' : ''}`,

    Kenya: `**KENYA-SPECIFIC CV REQUIREMENTS:**
• Use British English spelling (Kenyan system follows UK)
• Include county/city (e.g., "Nairobi, Kenya" or "Mombasa, Coastal Region")
• Mention KCSE results or university qualifications (e.g., degree from Nairobi University)
• Highlight tech literacy and mobile/digital skills
• Include any customer service or hospitality experience
• Emphasise professionalism and strong communication skills
${jobType === 'Hospitality' || jobType === 'Retail' ? '• Mention tourism industry experience if relevant\n• Highlight multi-lingual abilities (English, Swahili, local languages)' : ''}`,

    Other: `**INTERNATIONAL CV REQUIREMENTS:**
• Use British English spelling (international standard for CVs)
• Clearly state location and nationality/work rights
• Translate qualifications to international equivalents where possible
• Highlight transferable skills and international experience
• Mention language proficiencies clearly
• Emphasise cultural adaptability and global mindset`,
  };

  return regionalRules[country] || regionalRules['Other'];
}

/**
 * Get job type-specific guidance
 */
function getJobTypeGuidance(jobType: string): string {
  const jobTypeRules: Record<string, string> = {
    'Healthcare/NHS': `**HEALTHCARE/NHS CV FOCUS:**
• Prioritise patient care experience and clinical skills
• Mention specific wards/departments worked in
• Include healthcare certifications (BLS, ACLS, etc.)
• Emphasise compassion, attention to detail, teamwork
• Reference infection control, safeguarding, confidentiality awareness
• Use healthcare terminology appropriately (without overloading with jargon)`,

    'Care Work': `**CARE WORK CV FOCUS:**
• Highlight personal care skills (bathing, dressing, feeding, mobility support)
• Mention elderly care, dementia care, or disability support experience
• Include care certifications (Care Certificate, Moving & Handling, Medication Awareness)
• Emphasise patience, empathy, dignity, respect for service users
• Reference safeguarding and person-centred care approach
• Show understanding of care plans and documentation`,

    'Tech/IT': `**TECH/IT CV FOCUS:**
• List programming languages, frameworks, tools prominently
• Include GitHub profile, portfolio links, or project examples
• Mention tech certifications (AWS, CompTIA, Google, Microsoft)
• Highlight problem-solving and debugging experience
• Reference Agile/Scrum methodologies if applicable
• Show continuous learning (online courses, bootcamps, self-taught skills)`,

    Security: `**SECURITY CV FOCUS:**
• Include SIA licence or security certifications
• Mention surveillance, access control, incident reporting experience
• Highlight vigilance, reliability, physical fitness
• Reference conflict resolution and de-escalation skills
• Show understanding of health & safety protocols
• Emphasise punctuality and professional appearance`,

    Hospitality: `**HOSPITALITY CV FOCUS:**
• Highlight customer service and communication skills
• Mention experience with high-volume service (peak times, events)
• Include food safety certifications if relevant
• Emphasise teamwork, flexibility, and positive attitude
• Reference cash handling and POS system experience
• Show ability to work under pressure with a smile`,

    Retail: `**RETAIL CV FOCUS:**
• Emphasise customer service and sales skills
• Mention till operation, stock management, merchandising
• Include any sales targets achieved
• Highlight product knowledge and upselling ability
• Reference team collaboration and visual standards
• Show flexibility with shifts and busy periods`,

    Other: `**GENERAL WORK CV FOCUS:**
• Highlight transferable skills (communication, teamwork, problem-solving)
• Emphasise reliability, punctuality, and strong work ethic
• Include any relevant certifications or training
• Show adaptability and willingness to learn
• Reference customer-facing or collaborative experience`,
  };

  return jobTypeRules[jobType] || jobTypeRules['Other'];
}

/**
 * Generate cover letter using Gemini 2.5 Flash
 * ANTI-AI-DETECTION: Creates cover letters that pass AI detection tools
 */
export async function generateCoverLetter(params: {
  role: string;
  company: string;
  experience: string;
  keySkills?: string;
  whyCompany?: string;
  userName: string;
}): Promise<string> {
  const model = getGeminiModel();

  const prompt = `${ANTI_AI_DETECTION_RULES}

**YOUR TASK:**
Write a professional cover letter that PASSES AI DETECTION TOOLS.

**Applicant Details:**
- Name: ${params.userName}
- Target Role: ${params.role}
- Company: ${params.company}
- Relevant Experience: ${params.experience}
${params.keySkills ? `- Key Skills: ${params.keySkills}` : ''}
${params.whyCompany ? `- Why this company: ${params.whyCompany}` : ''}

**Cover Letter Structure:**

[Date]

Hiring Manager
${params.company}

Dear Hiring Manager,

**Opening Paragraph (2-3 sentences):**
- State the position you're applying for
- Brief hook about why you're a good fit
- Keep it conversational and genuine

**Body Paragraph 1 (3-4 sentences):**
- Describe your relevant experience from the details above
- Use specific examples, not generic claims
- Write like you're explaining your background to a friend
- Mix quantified achievements with qualitative ones

**Body Paragraph 2 (3-4 sentences):**
- Connect your skills to what the company needs
- Show you understand the role
- Sound genuine, not like marketing copy
${params.whyCompany ? `- Mention why you're interested in ${params.company}` : ''}

**Closing Paragraph (2 sentences):**
- Express enthusiasm
- Clear call to action (e.g., "I'd welcome the opportunity to discuss...")

Yours sincerely,
${params.userName}

**CRITICAL REMINDERS:**
- NO emojis
- NO AI buzzwords (spearheaded, leveraged, orchestrated, synergized, etc.)
- Use British English (organised, realised, etc.)
- Write conversationally - like talking to a hiring manager over coffee
- Mix sentence structures and lengths
- Sound professional but human
- Use realistic, specific achievements
- Approximately 250-350 words total

Generate the cover letter now in markdown format:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

// Real human CV examples that scored 100% HUMAN on GPTZero
const REAL_HUMAN_CV_EXAMPLES = `
**THESE ARE 3 REAL CVs THAT SCORED 100% HUMAN ON GPTZERO. COPY THEIR STYLE EXACTLY.**

**EXAMPLE #1 - Dennis (Construction) - 100% HUMAN:**

DENNIS AMPONSAH
3B Chesterton Road, London, W10 5LY · 07740 047147
Email: dennisamponsah112@icloud.com

SUMMARY
Energetic and self-motivated Construction Manager involved in all facets of building construction from
pre-construction to hand over. Proactive and experienced in managing construction teams and sub-
contractors on projects. Successful in creating effective communication between personnel, general
contractors and the management team.

EXPERIENCE
Current:
Logistics/ Site Manager Collins Construction – London
Coordination of sub-contractors on site.
Implementation of all company safety and quality procedures
Act as liaison with company safety representatives to promote awareness and understanding of safety
protocols, procedures and initiatives
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

**EXAMPLE #2 - Guillaume (Career Services) - 100% HUMAN:**

SUMMARY
I can define myself as having too many ideas for a single life :)

After a start of career in the recruitment industry in Paris, Dublin and then Lausanne, I decided to launch my own service company in 2013. Strangely, it wasn't a recruitment company, but an outplacement firm.

I find it to be much more rewarding (not in terms of cash but in terms of human-based experience)!

**EXAMPLE #3 - Business Dev Manager - 100% HUMAN:**

SUMMARY
Adaptable and multidisciplined Sales Leader with proven experience building, defining, and managing sales operations across a range of products and services. Gifted communicator who leads and empowers diverse teams while coordinating with clients from all backgrounds.

EXPERIENCE
Business Development Manager
Brought on to build, establish and define entirety of company's lead generation at the late-stage startup phase
Maximize performance of sales development representatives by leading coaching and upskilling sessions
Liaise with client business owners and executives at each stage of sales lifecycle
Consistently scope and identify opportunities to improve business
Exceeded lead pipeline generation goal by 190%
Enhanced operations by planning, building out, and implementing all lead generation functions within 30 days

**EXAMPLE #4 - Shaffic (Health/Care Worker, Ghana to Scotland) - 100% HUMAN:**

AYAWU SHAFFIC
Substance Misuse Recovery Worker | Health in Justice / Prison Healthcare
Catrine, Scotland
Tel: 07917 718 879 | Email: ayawushaffic0249@gmail.com
Right to Work: UK (No sponsorship required)
Availability: Full-time (37.5 hours, Monday–Friday)
Clearance: Eligible for Enhanced DBS and willing to undertake prison vetting and security checks

PROFESSIONAL SUMMARY
Compassionate, resilient, and security-aware Health in Justice practitioner with over 8 years'
experience supporting vulnerable adults with substance misuse, mental health needs, and
complex behavioural challenges across regulated healthcare and support environments in the
UK and internationally. Experienced in promoting recovery, harm reduction, and positive
behaviour change through structured, person-centred interventions while maintaining
professional boundaries, safeguarding standards, and legal/governance requirements.

KEY SKILLS & CORE COMPETENCIES
• Substance Misuse & Recovery Support
• Drug & Alcohol Harm Reduction
• Behaviour Change & Motivational Support
• Safeguarding Adults & Risk Management
• Person-Centred Care Planning
• Trauma-Informed Practice
• Medication Support & Monitoring
• MDT Working (NHS, Prison Healthcare & Partner Agencies)
• Professional Boundaries & Security Awareness

PROFESSIONAL EXPERIENCE

Care Worker
Prestine Healthcare Group – Edinburgh, Scotland
February 2025 – Present
• Deliver structured, person-centred support to adults with complex needs, promoting emotional stability and healthier coping strategies.
• Support individuals to engage positively with daily routines, contributing to improved wellbeing and reduced distress-related behaviours.
• Actively follow safeguarding procedures, infection control measures, and organisational governance to support risk reduction and safety.
• Maintain accurate, timely, and confidential care records in line with information governance requirements.

Support Worker
Agile Healthcare Services Ltd – Glasgow, Scotland
October 2023 – Present
• Support adults with autism, mental health conditions, and complex behavioural needs within structured and regulated care settings.
• Promote independence, emotional regulation, and recovery-focused behaviour change through consistent engagement.
• Administer and document medication accurately in line with care plans, clinical guidance, and organisational policy.
• Identify, manage, and escalate risk appropriately, contributing to safe environments for service users and staff.

EDUCATION
• Level 3 Diploma in Health & Social Care – Inspire College of London, UK (In progress, 2025)
• MSc Business Management – Glasgow Caledonian University, UK (2024)
• Diploma in Social Education – Bagabaga College of Education, Tamale, Ghana (2011)

**KEY PATTERNS (WHY THEY SCORED 100% HUMAN):**
✓ MIXED FORMATS - Dennis mixes paragraphs + bullets. Guillaume uses narrative. Bizdev uses all bullets. Shaffic uses complete sentence bullets.
✓ SIMPLE LANGUAGE - "working closely with", "responsible for", "involved in", "support individuals to"
✓ INCONSISTENT - Some bullets have periods, some don't. Natural imperfections.
✓ PERSONAL VOICE - Guillaume uses "I", emoticons :), parentheses (not in terms of cash...)
✓ REAL JOBS - Actual career changes with context (Shaffic: Ghana to Scotland)
✓ NO AI WORDS - None of them use: spearheaded, leveraged, orchestrated, optimized
✓ CARE SECTOR STYLE (Shaffic) - Real sector language: "person-centred", "safeguarding", "MDT working", "trauma-informed"
✓ PRACTICAL DETAIL - Shaffic includes DBS clearance, availability hours, right to work status
`;

/**
 * Generate CV from voice recording transcript
 * TEMPLATE-BASED APPROACH: Uses real 100% human CVs as examples
 * Tested and confirmed: 99% HUMAN score on GPTZero
 */
export async function generateCVFromVoice(params: {
  transcript: string;
  userName: string;
  userEmail: string;
  phone?: string;
  location?: string;
  country?: string;
  jobType?: string;
}): Promise<string> {
  const model = getGeminiModel();

  // Regional customization based on country
  const regionalGuidance = params.country
    ? getRegionalGuidance(params.country, params.jobType)
    : '';

  // Job-specific customization
  const jobTypeGuidance = params.jobType
    ? getJobTypeGuidance(params.jobType)
    : '';

  const prompt = `**CRITICAL: Generate CV that scores 99%+ HUMAN on GPTZero**

I'm showing you 3 REAL CVs that scored 100% HUMAN on GPTZero. Write a NEW CV in the SAME STYLE.

${REAL_HUMAN_CV_EXAMPLES}

**COPY THESE PATTERNS:**
1. **Mix formats** - Dennis mixes paragraphs + bullets. Not everything needs bullets!
2. **Simple verbs** - "working closely with", "responsible for", "involved in", "managing", "ensuring"
3. **Be inconsistent** - Some bullets have periods, some don't. This is HUMAN.
4. **Personal touch** - Guillaume uses "I" and emoticons :). Be natural.
5. **Real jobs** - Show actual work, not marketing copy
6. **NEVER use AI words** - NO: spearheaded, leveraged, orchestrated, optimized, streamlined, facilitated

**YOUR TASK:**
Write a CV for ${params.userName} using their voice transcript. COPY Dennis's style EXACTLY.

**Person's Information:**
Name: ${params.userName}
Email: ${params.userEmail}
${params.phone ? `Phone: ${params.phone}` : ''}
${params.location ? `Location: ${params.location}` : ''}
${params.country ? `Target Country: ${params.country}` : ''}
${params.jobType ? `Job Type: ${params.jobType}` : ''}

${regionalGuidance ? `\n${regionalGuidance}\n` : ''}
${jobTypeGuidance ? `\n${jobTypeGuidance}\n` : ''}

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

[Another Job if mentioned]
[Use different format than the first job - maybe just bullets, or just a paragraph]

EDUCATION
[Simple format - Qualification | Institution | Year]

**REMEMBER:** The goal is to write like a REAL PERSON wrote this CV, not like AI. Be slightly messy, inconsistent, and natural. That's what makes it human!

Generate the CV now:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Revamp existing CV
 * ANTI-AI-DETECTION: Transforms CVs to pass AI detection tools
 */
export async function revampCV(params: {
  currentCVText: string;
  userName: string;
  userEmail: string;
}): Promise<string> {
  const model = getGeminiModel();

  const prompt = `${ANTI_AI_DETECTION_RULES}

**YOUR TASK:**
Revamp this CV to international standards while ensuring it PASSES AI DETECTION TOOLS.

**Current CV Content:**
${params.currentCVText}

**Applicant Information:**
- Name: ${params.userName}
- Email: ${params.userEmail}

**Revamp Requirements:**

1. **Restructure to Traditional CV Format:**
   **${params.userName}**
   Email | Phone | Location

   **Professional Summary** (2-3 sentences, conversational)

   **Professional Experience** (reverse chronological)
   **Job Title** | Company | Location | Dates
   • 3-5 bullet points per role

   **Education**
   Degree | Institution | Location | Year

   **Skills**
   Simple list format

2. **Rewrite ALL Experience Bullet Points:**
   - Remove AI buzzwords: spearheaded → led, leveraged → used, orchestrated → organized, optimized → improved
   - Make them sound conversational, like describing the job to a friend
   - Mix sentence structures - don't start every bullet the same way
   - Use realistic numbers (e.g., "improved by 15%" not "optimized by 23.7%")
   - NOT every bullet needs a number - mix quantified and qualitative
   - Write like a human casually describing their actual work

3. **Fix Grammar and British English:**
   - organised (not organized)
   - realised (not realized)
   - colour, favour, analyse, centre, specialise

4. **Natural Formatting:**
   - Plain bullet points (•) only
   - NO fancy symbols, emojis, or decorative elements
   - Traditional, boring layout
   - Clean section hierarchy

5. **What Makes It Pass AI Detection:**
   - Natural imperfections and slight style inconsistencies
   - Conversational phrasing
   - Realistic job descriptions
   - Mix of concrete and abstract achievements
   - Human-like variation in bullet points

**CRITICAL - MUST REMOVE:**
- ALL emojis (🎯 ✨ 📊 💼 🚀)
- AI buzzwords: spearheaded, leveraged, synergized, orchestrated, optimized, streamlined, facilitated, championed, pioneered, revolutionized
- Fancy bullet symbols (◦ ▪ ▸ ✓ ► ⬥)
- Horizontal lines (────)
- Corporate jargon and marketing speak
- Section names like "Career Highlights", "Core Competencies", "Professional Synopsis"

**Extract from their CV:**
- Work experience (job titles, companies, dates, responsibilities)
- Education details
- Skills
- Contact information

**Keep to 1-2 pages of content.**

Generate the revamped CV now in markdown format:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate interview questions for specific role
 */
export async function generateInterviewQuestions(params: {
  role: string;
  level: string;
}): Promise<string[]> {
  const model = getGeminiModel();

  const prompt = `Generate 10 realistic interview questions for a ${params.role} position at ${params.level} level.

**Requirements:**
1. Mix of behavioral, technical, and situational questions
2. Relevant to ${params.role} in UK/international context
3. Appropriate difficulty for ${params.level} level
4. Include 2-3 questions about handling challenges
5. Include 1-2 questions about career goals
6. Avoid generic questions - make them role-specific

Return ONLY a JSON array of questions, no other text:
["Question 1", "Question 2", ...]`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON array from response
  try {
    return JSON.parse(text);
  } catch (error) {
    // Fallback: extract questions manually if JSON parsing fails
    const questions = text.split('\n').filter(line => line.trim().length > 0);
    return questions.slice(0, 10);
  }
}

/**
 * Generate interview prep PDF content
 */
export async function generateInterviewPrepGuide(params: {
  role: string;
  level: string;
  company?: string;
  industry?: string;
}): Promise<string> {
  const model = getGeminiModel();

  const prompt = `You are an expert career coach specializing in interview preparation.

**Task:** Create a comprehensive interview preparation guide.

**Interview Details:**
- Role: ${params.role}
- Level: ${params.level}
${params.company ? `- Company: ${params.company}` : ''}
${params.industry ? `- Industry: ${params.industry}` : ''}

**Guide Structure:**
1. **About the Role**
   - Key responsibilities
   - Required skills and qualifications

2. **50+ Interview Questions**
   - Behavioral questions (20)
   - Technical/Role-specific questions (20)
   - Situational questions (10)
   - Questions about the company (5)

3. **STAR Method Framework**
   - Explanation with examples
   - Template for crafting answers

4. **Model Answers**
   - 5 example answers using STAR method
   - Tailored to ${params.role}

5. **Questions to Ask Them**
   - 10 smart questions to ask the interviewer
   - Shows research and genuine interest

6. **Company Research Template**
   - What to research
   - How to weave it into answers

7. **Day-Before Checklist**
   - Final preparation steps
   - What to bring
   - Logistics

**Requirements:**
- Specific to ${params.role} and ${params.level}
- Professional, actionable advice
- UK/International context
- Clear formatting with headers
- Output in markdown format

Generate the complete interview prep guide now:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
