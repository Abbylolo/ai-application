/**
 * Supabase Auth 模块
 * 前端直接用 Supabase SDK 做登录认证
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqfgdeddzokontbdcsna.supabase.co'
const supabaseAnonKey = 'ANON_KEY_PLACEHOLDER'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 当前用户
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 注册
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

// 登录
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// 登出
export async function signOut() {
  await supabase.auth.signOut()
}

// 获取当前 session 的 access_token（用来传给后端）
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
