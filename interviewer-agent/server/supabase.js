import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqfgdeddzokontbdcsna.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZmdkZWRkem9rb250YmRjc25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTM2OTgsImV4cCI6MjA5NjkyOTY5OH0.LhNW85TYZqbYHU4YcxfO-ep-NUI946wlMCyHszVoaAo'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testConnection() {
  const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
  return { ok: !error, error: error?.message }
}
