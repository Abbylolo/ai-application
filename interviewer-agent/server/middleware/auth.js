/**
 * Supabase Auth 中间件
 * 从 Authorization header 提取 JWT，验证并解析 user_id
 */
import { supabase } from '../supabase.js'

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }

  const token = authHeader.split(' ')[1]

  // 方案：用 Supabase 验证 token 获取当前用户
  // 传 jwt 参数来指定要验证的 token（而不是客户端自己的 session）
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    console.error('Token验证失败:', error?.message)
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }

  req.userId = user.id
  next()
}
