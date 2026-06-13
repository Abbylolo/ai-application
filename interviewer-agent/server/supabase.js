import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqfgdeddzokontbdcsna.supabase.co'
// 服务端用 service_role key，可验证 token + 绕过 RLS
const supabaseKey = 'SUPABASE_KEY_PLACEHOLDER'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testConnection() {
  const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
  return { ok: !error, error: error?.message }
}
