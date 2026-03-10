// POST /api/consume-credit
// Called by UploadPage before starting a schematic analysis.
// Checks credit balance and deducts 1 credit atomically.
// Returns { allowed: true } or { allowed: false, upgrade_url, credits_remaining }.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAndConsumeCredit } from './lib/creditGate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body as { userId?: string };

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const result = await checkAndConsumeCredit(userId);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('consume-credit error:', err);
    return res.status(500).json({ error: err.message || 'Credit check failed' });
  }
}
