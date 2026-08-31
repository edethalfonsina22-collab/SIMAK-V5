import { createClient } from '@supabase/supabase-js'

// Ambil dari environment variable, JANGAN hardcode value asli di sini.
// Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di:
// - file .env.local (untuk development, jangan di-commit ke GitHub)
// - dashboard hosting (Vercel/Netlify -> Environment Variables) untuk production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL/Anon Key belum di-set. Cek file .env.local atau environment variables di hosting.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
