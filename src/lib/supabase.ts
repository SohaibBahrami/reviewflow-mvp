import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

let clientPromise: Promise<SupabaseClient | null> | null = null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  if (clientPromise) return clientPromise

  clientPromise = import('@supabase/supabase-js').then(({ createClient }) => (
    createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  ))

  return clientPromise
}
