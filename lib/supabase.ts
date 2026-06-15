import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    _client = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  },
})
