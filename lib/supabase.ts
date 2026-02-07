import { createClient } from '@supabase/supabase-js'

// Use placeholders for build time if env vars are missing
// HARDCODED credentials for Project A (ewrelkbdqzywdjrgsadt) to fix persistent env issues
const supabaseUrl = 'https://ewrelkbdqzywdjrgsadt.supabase.co'
const supabaseAnonKey = 'sb_publishable_hWakXphh0eSr3vVbg82w1g_VsEd21D4'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL, using placeholder for build')
}

// Standard client for client-side operations (respects RLS)
if (typeof window !== 'undefined') {
    console.log('Supabase Browser Init (Project A Forced):', {
        url: supabaseUrl,
        keyPrefix: supabaseAnonKey?.substring(0, 15) + '...'
    })
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
