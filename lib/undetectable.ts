/**
 * Undetectable.ai API Client
 * Humanizes AI-generated text to pass AI detection tools.
 *
 * Flow: submit text → poll for completion → retrieve humanized output
 * Docs: https://help.undetectable.ai/en/article/humanization-api-v2-p28b2n/
 */

const BASE_URL = 'https://humanize.undetectable.ai';

/**
 * Submit text to be humanized.
 * Returns a document ID to poll for results.
 */
export async function submitForHumanization(
  content: string,
  options?: {
    readability?: 'High School' | 'University' | 'Doctorate' | 'Journalist' | 'Marketing';
    purpose?: 'General Writing' | 'Essay' | 'Article' | 'Marketing Material' | 'Story' | 'Cover Letter' | 'Report' | 'Business Material' | 'Legal Material';
    strength?: 'Quality' | 'Balanced' | 'More Human';
    model?: 'v2' | 'v11' | 'v11sr';
  }
): Promise<string> {
  const apiKey = process.env.UNDETECTABLE_API_KEY;
  if (!apiKey) {
    throw new Error('UNDETECTABLE_API_KEY not set in environment variables');
  }

  const res = await fetch(`${BASE_URL}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      content,
      readability: options?.readability || 'University',
      purpose: options?.purpose || 'General Writing',
      strength: options?.strength || 'More Human',
      model: options?.model || 'v11',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Undetectable submit failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Retrieve a humanized document by ID.
 * Returns null if still processing, or the humanized text if done.
 */
export async function retrieveDocument(
  id: string
): Promise<{ output: string | null; status: string }> {
  const apiKey = process.env.UNDETECTABLE_API_KEY;
  if (!apiKey) {
    throw new Error('UNDETECTABLE_API_KEY not set in environment variables');
  }

  const res = await fetch(`${BASE_URL}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Undetectable retrieve failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return {
    output: data.output || null,
    status: data.status || 'processing',
  };
}

/**
 * Check remaining word credits.
 */
export async function checkCredits(): Promise<{ credits: number; baseCredits: number; boostCredits: number }> {
  const apiKey = process.env.UNDETECTABLE_API_KEY;
  if (!apiKey) {
    throw new Error('UNDETECTABLE_API_KEY not set in environment variables');
  }

  const res = await fetch(`${BASE_URL}/check-user-credits`, {
    method: 'GET',
    headers: { 'apikey': apiKey },
  });

  if (!res.ok) {
    throw new Error(`Credits check failed (${res.status})`);
  }

  return await res.json();
}

/**
 * Submit text and poll until humanized result is ready.
 * Best quality on passages of 200+ words.
 *
 * @param content - Text to humanize (min 50 chars)
 * @param options - Humanization options
 * @param maxWaitMs - Max wait time (default 120s)
 * @returns Humanized text
 */
export async function humanizeText(
  content: string,
  options?: {
    readability?: 'High School' | 'University' | 'Doctorate' | 'Journalist' | 'Marketing';
    purpose?: 'General Writing' | 'Essay' | 'Article' | 'Marketing Material' | 'Story' | 'Cover Letter' | 'Report' | 'Business Material' | 'Legal Material';
    strength?: 'Quality' | 'Balanced' | 'More Human';
    model?: 'v2' | 'v11' | 'v11sr';
  },
  maxWaitMs: number = 120000
): Promise<string> {
  // Skip if content is too short for good results
  if (content.length < 50) {
    console.warn('[Undetectable] Content too short (<50 chars), skipping humanization');
    return content;
  }

  const docId = await submitForHumanization(content, options);
  console.log(`[Undetectable] Submitted document ${docId}, polling for result...`);

  const startTime = Date.now();
  const pollInterval = 5000; // Poll every 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const result = await retrieveDocument(docId);

    if (result.output) {
      console.log(`[Undetectable] Document ${docId} humanized successfully`);
      return result.output;
    }
  }

  throw new Error(`Humanization timed out after ${maxWaitMs / 1000}s for document ${docId}`);
}

/**
 * Humanize a CV by splitting into sections to maintain structure.
 * Each section is humanized separately so formatting isn't lost.
 * Sections under 50 chars are kept as-is (headers, contact info).
 */
export async function humanizeCV(
  cvText: string,
  options?: {
    purpose?: 'General Writing' | 'Cover Letter' | 'Report' | 'Business Material';
    strength?: 'Quality' | 'Balanced' | 'More Human';
  }
): Promise<string> {
  // Split CV into major sections by double newlines or section headers
  const sections = cvText.split(/\n{2,}/);
  const humanizedSections: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();

    // Skip empty sections
    if (!trimmed) {
      humanizedSections.push('');
      continue;
    }

    // Keep short sections as-is (headers, contact info, dates)
    // Also keep sections that are just a title/heading
    if (trimmed.length < 50 || /^[A-Z\s&|•\-,.:]+$/.test(trimmed)) {
      humanizedSections.push(trimmed);
      continue;
    }

    try {
      const humanized = await humanizeText(trimmed, {
        readability: 'University',
        purpose: options?.purpose || 'General Writing',
        strength: options?.strength || 'More Human',
        model: 'v11',
      });
      humanizedSections.push(humanized);
    } catch (error) {
      console.error(`[Undetectable] Section humanization failed, keeping original:`, error);
      humanizedSections.push(trimmed);
    }
  }

  return humanizedSections.join('\n\n');
}
