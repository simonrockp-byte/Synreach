// AI Personalization Brain — generates icebreakers via secure backend (Google Gemini)

export const INDUSTRIES = [
  { value: 'hr',         label: 'HR & People Ops' },
  { value: 'saas',       label: 'SaaS / Tech' },
  { value: 'finance',    label: 'Finance & Fintech' },
  { value: 'ecommerce',  label: 'E-Commerce' },
  { value: 'default',    label: 'General Business' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Generates a personalized icebreaker message for a lead via the secure backend.
 * The API key never leaves the server.
 * @param {Object} lead - Lead data (name, title, company, industry, context)
 * @returns {Promise<string>} The generated icebreaker text
 */
export async function generateIcebreaker(lead) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead,
      industry: lead.industry,
      context: lead.context,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Generation failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.draft;
}
