import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Used in API routes to act as the authenticated user (respects RLS)
export function createUserClient(accessToken: string) {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

// Used in server callbacks where no user token is available (bypasses RLS)
export function createAdminClient() {
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
