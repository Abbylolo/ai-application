import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqfgdeddzokontbdcsna.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testConnection() {
  const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
  return { ok: !error, error: error?.message }
}
