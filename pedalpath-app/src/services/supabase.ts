import { createClient } from '@supabase/supabase-js'

// Strip whitespace/newlines — env vars stored in Vercel can have embedded line breaks
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\s+/g, '')
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').replace(/\s+/g, '')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
