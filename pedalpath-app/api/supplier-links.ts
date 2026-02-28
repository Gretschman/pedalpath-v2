import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { type, value } = req.query;

  if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing required query params: type and value',
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('supplier_links')
      .select('supplier, url, price_usd, in_stock')
      .eq('component_type', type.toLowerCase())
      .ilike('value', value);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      links: data ?? [],
    });
  } catch (err: any) {
    console.error('Unexpected error in supplier-links:', err);
    return res.status(500).json({ success: false, error: err.message ?? 'Unknown error' });
  }
}
