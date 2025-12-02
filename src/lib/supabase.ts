import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 0

// Create client only if configured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server-side client with service role for admin operations
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured && supabaseServiceKey.length > 0
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null
