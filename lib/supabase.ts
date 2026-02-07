import { createClient } from '@supabase/supabase-js'

// Use placeholders for build time if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL, using placeholder for build')
}

// Standard client for client-side operations (respects RLS)
if (typeof window !== 'undefined') {
    const isPlaceholder = supabaseAnonKey === 'placeholder-key'
    const isNewFormat = supabaseAnonKey?.startsWith('sb_')

    console.log('Supabase Browser Init:', {
        url: supabaseUrl,
        keyLength: supabaseAnonKey?.length,
        isPlaceholder,
        isNewFormat,
        keyPrefix: supabaseAnonKey?.substring(0, 10)
    })

    if (isPlaceholder) {
        console.error('CRITICAL: Supabase Anon Key is missing! Check .env.local and restart dev server.')
    }
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side trusted operations (bypasses RLS)
// access this only in server contexts or API routes, NOT in client components
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null
