import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.GEMINI_KEY;

  if (!key) {
    return res.status(500).json({ error: 'GEMINI_KEY not configured' });
  }

  return res.status(200).json({ key });
}
