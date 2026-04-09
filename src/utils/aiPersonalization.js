// AI Personalization Brain — generates human-sounding icebreakers via Google Gemini API

export const INDUSTRIES = [
  { value: 'hr',         label: 'HR & People Ops' },
  { value: 'saas',       label: 'SaaS / Tech' },
  { value: 'finance',    label: 'Finance & Fintech' },
  { value: 'ecommerce',  label: 'E-Commerce' },
  { value: 'default',    label: 'General Business' },
];

// Fine-tuned system prompts per industry vertical
const SYSTEM_PROMPTS = {
  hr: `You are a warm, empathetic HR professional and talent strategist.
You write outreach icebreakers that feel like they're coming from a thoughtful peer, not a vendor.
Focus on people operations, culture-building, hiring velocity, and workforce challenges.
Your tone is supportive, human-first, and never pushy.`,

  saas: `You are a sharp, insight-driven SaaS sales professional.
You write icebreakers that lead with curiosity and value, never with a pitch.
Reference product adoption, growth metrics, churn signals, or industry benchmarks.
Your tone is confident, peer-level, and concise.`,

  finance: `You are a credible fintech and financial services business developer.
You write icebreakers grounded in market dynamics, regulatory shifts, or operational efficiency.
Your tone is precise, data-aware, and trustworthy — not salesy.`,

  ecommerce: `You are an e-commerce growth consultant who understands conversion funnels, retention loops, and fulfillment challenges.
You write icebreakers focused on revenue impact and customer experience.
Your tone is direct, practical, and results-oriented.`,

  default: `You are a thoughtful sales development professional who values genuine human connection.
You write icebreakers that feel completely personal — never templated.
Your tone is professional yet warm, and always respectful of the recipient's time.`,
};

/**
 * Generates a personalized icebreaker message for a lead using Google Gemini.
 * @param {Object} lead - Lead data (name, title, company, industry, platform, context)
 * @param {string} apiKey - Google AI Studio API key
 * @returns {Promise<string>} The generated icebreaker text
 */
export async function generateIcebreaker(lead, apiKey) {
  if (!apiKey) throw new Error('API key is required. Add it in the panel above.');

  const system = SYSTEM_PROMPTS[lead.industry] || SYSTEM_PROMPTS.default;

  const prompt = `Write a single personalized outreach icebreaker for the following lead.

Rules:
- Exactly 2–3 sentences, no more
- Reference the specific context/hook provided — make it feel like you actually read their work
- End with a natural, low-pressure conversation opener (not a hard CTA or "Would you be open to a call?")
- Never start with "I" as the first word
- Output ONLY the message body — no greeting like "Hi Sarah,", no sign-off, no quotes

Lead Details:
- Name: ${lead.name}
- Title: ${lead.title || 'Professional'}
- Company: ${lead.company || 'their company'}
- Outreach Platform: ${lead.platform}
- Context / Hook: ${lead.context || 'their professional background and recent activity'}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 220, temperature: 0.85 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `API error (HTTP ${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini. Check your API key and quota.');
  return text.trim();
}
