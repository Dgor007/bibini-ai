/**
 * CV Templates - Real human-written CV patterns
 * Extracted from 100% human-scoring CVs on GPTZero
 */

export const HUMAN_CV_PATTERNS = {
  // Real phrases from Dennis Amponsah's CV (100% human on GPTZero)
  dennis: {
    summaryPatterns: [
      'Energetic and self-motivated [ROLE] involved in all facets of [FIELD] from [START] to [END].',
      'Proactive and experienced in managing [TEAMS] and [STAKEHOLDERS] on projects.',
      'Successful in creating effective communication between [GROUP1], [GROUP2] and the [GROUP3].',
      'Safety orientated, consistently monitors [WORK] to ensure proper compliance with [STANDARDS].',
    ],
    jobDescriptionStyle: 'paragraph', // Uses paragraph descriptions, not just bullets
    bulletPatterns: [
      'Coordination of [STAKEHOLDERS] on site.',
      'Implementation of all company [POLICIES] and [PROCEDURES]',
      'Act as liaison with [TEAM] to promote awareness and understanding of [TOPICS]',
      'Ensure compliance with [DOCUMENTS]',
      'Manage teams of [WORKERS] from [STAGE1], [STAGE2] to [STAGE3] and [STAGE4]',
      'Consistently assuming additional responsibilities and hours to achieve [GOALS]',
      'Management, hiring and training of staff',
      'Budgeting and Business development working closely with [TEAMS] to ensure [OUTCOME]',
      'Responsible for all [AREA] including [DETAILS]',
      'Sourcing and budgeting of [ITEMS]',
      'Developing new [ITEMS], costing, budgeting and obtaining [RESOURCES]',
      'Managing staff and [WORKPLACE] including [LIST]',
    ],
    usesMixedFormat: true,
  },

  // Real phrases from Guillaume's CV (LinkedIn narrative style)
  guillaume: {
    summaryStyle: 'first-person-narrative',
    summaryPatterns: [
      'I can define myself as [DESCRIPTION]',
      'After a start of career in [FIELD] in [LOCATIONS], I decided to launch my own [BUSINESS]',
      'I find it to be much more rewarding (not in terms of cash but in terms of [VALUES])!',
      'I had the chance to work with [PEOPLE] in [LOCATION]',
      'In [YEAR], I founded [VENTURE] with [COLLABORATORS] convinced that [BELIEF]',
    ],
    usesParagraphs: true,
    personalTouch: true,
  },

  // Real phrases from Business Development Manager CV
  bizdev: {
    summaryPatterns: [
      'Adaptable and multidisciplined [ROLE] with proven experience building, defining, and managing [OPERATIONS] across a range of [OFFERINGS] in competitive industries.',
      'Leverages [QUALITIES] to achieve [GOALS] at each stage of the [PROCESS]',
      'Gifted communicator who leads and empowers diverse teams while coordinating with [STAKEHOLDERS] from all backgrounds',
      'Driven to carry exceptional skills and enthusiasm in [ACTIVITY]',
    ],
    bulletPatterns: [
      'Brought on to build, establish and define entirety of [PROCESS] at the [STAGE] phase',
      'Maximize performance of [TEAM] by leading coaching and upskilling sessions on best practices',
      'Spearhead all [PROGRAMS] including [CHANNELS]',
      'Liaise with [STAKEHOLDERS] at each stage of [PROCESS]',
      'Consistently scope and identify opportunities to improve business and create opportunities',
      'Exceeded [GOAL] by [PERCENTAGE]%',
      'Enhanced operations by planning, building out, and implementing all [FUNCTIONS] within [TIMEFRAME]',
      'Unified [SYSTEM] while promoting [PHILOSOPHY] by organizing [PROGRAM]',
      'Organized, wrote copy for, and deployed [INITIATIVE]',
      'Developed [ASSET] organizing [EVENTS] that regularly attracted [NUMBERS]',
      'Empowered trained team members to [ACHIEVEMENT]',
      'Led and trained [NUMBER]-member [TEAM] in best [PRACTICES]',
      'Generated [NUMBER] new opportunities from developing [PROCESS]',
      'Consistently Achieved [PERCENTAGE]% conversion on leads',
      'Instrumental in onboarding major clients like [CLIENTS]',
    ],
    usesSpecificNumbers: true,
  },
};

/**
 * Common human writing patterns across all CVs
 */
export const HUMAN_WRITING_TRAITS = {
  // Things humans do that AI doesn't
  imperfections: [
    'inconsistent_punctuation', // Some bullets have periods, some don't
    'mixed_tenses', // Switch between past/present
    'formatting_variations', // Not perfectly aligned
    'minor_typos_acceptable', // Small typos are okay (make it human)
  ],

  // Simple connecting words humans use
  connectors: [
    'working closely with',
    'responsible for all',
    'involved in',
    'including',
    'ensuring',
    'mainly',
    'also',
    'helped',
    'worked on',
  ],

  // How humans write about achievements
  achievementStyles: [
    'Achieved [X]',
    'Exceeded [X] by [Y]%',
    'Successfully [ACTION] resulting in [OUTCOME]',
    'Improved [X] by [Y]',
    'Led [X] to achieve [Y]',
    'Responsible for [X] which resulted in [Y]',
  ],
};

/**
 * Regional job market patterns (from user feedback)
 */
export const REGIONAL_PATTERNS = {
  Ghana: {
    careWork: {
      commonBackgrounds: [
        'family-based care experience',
        'community volunteer work',
        'church/religious organization involvement',
      ],
      certifications: [
        'Care Certificate',
        'First Aid',
        'Basic Life Support',
      ],
      emphasisOn: [
        'patience and empathy',
        'respect for elderly',
        'cultural sensitivity',
        'reliability and honesty',
      ],
    },
  },
  Nigeria: {
    techIT: {
      commonBackgrounds: [
        'self-taught programming',
        'coding bootcamp graduate',
        'remote work for international clients',
      ],
      emphasisOn: [
        'problem-solving in challenging environments',
        'adaptability',
        'continuous learning',
      ],
    },
  },
  UK: {
    careWork: {
      certifications: [
        'NVQ Level 2/3 in Health & Social Care',
        'Care Certificate',
        'Moving & Handling',
        'Safeguarding',
        'DBS check',
      ],
      emphasisOn: [
        'person-centred care',
        'dignity and respect',
        'CQC standards',
        'care planning',
      ],
    },
  },
};
