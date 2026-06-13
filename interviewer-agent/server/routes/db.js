import { Router } from 'express'
import { supabase } from '../supabase.js'
import { authMiddleware } from '../middleware/auth.js'

export const dbRouter = Router()

// 所有数据库操作需要登录
dbRouter.use(authMiddleware)

// 获取当前用户 ID
function uid(req) { return req.userId }

// ========== 用户档案 ==========

dbRouter.get('/profiles', async (req, res) => {
  const { data, error } = await supabase.from('user_profiles')
    .select('*').eq('user_id', uid(req)).order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/profiles', async (req, res) => {
  console.log('📝 Profile save body keys:', Object.keys(req.body), 'avatar:', req.body.avatar)
  const profile = { ...req.body, user_id: uid(req) }

  if (profile.id) {
    const { data, error } = await supabase.from('user_profiles')
      .update(profile).eq('id', profile.id).eq('user_id', uid(req)).select().single()
    if (!data) return res.status(404).json({ error: '记录不存在' })
    res.json(data)
  } else {
    const { data, error } = await supabase.from('user_profiles')
      .insert(profile).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  }
})

dbRouter.delete('/profiles/:id', async (req, res) => {
  await supabase.from('user_profiles').delete().eq('id', req.params.id).eq('user_id', uid(req))
  res.json({ success: true })
})

// ========== 模型配置 ==========

dbRouter.get('/model-configs', async (req, res) => {
  const { data, error } = await supabase.from('model_configs')
    .select('*').eq('user_id', uid(req)).order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/model-configs', async (req, res) => {
  const config = { ...req.body, user_id: uid(req) }

  // 如果设为默认，取消该用户其他默认
  if (config.is_default) {
    await supabase.from('model_configs').update({ is_default: false })
      .eq('user_id', uid(req)).neq('id', config.id || '')
  }

  const { data, error } = await supabase.from('model_configs')
    .upsert(config, { onConflict: 'id' }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.delete('/model-configs/:id', async (req, res) => {
  await supabase.from('model_configs').delete().eq('id', req.params.id).eq('user_id', uid(req))
  res.json({ success: true })
})

// ========== 面试记录 ==========

dbRouter.get('/interviews', async (req, res) => {
  const { data, error } = await supabase.from('interviews')
    .select('*').eq('user_id', uid(req)).order('started_at', { ascending: false }).limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/interviews', async (req, res) => {
  const interview = { ...req.body, user_id: uid(req) }

  if (interview.id) {
    const { data, error } = await supabase.from('interviews')
      .update(interview).eq('id', interview.id).eq('user_id', uid(req)).select().single()
    if (!data) return res.status(404).json({ error: '记录不存在' })
    res.json(data)
  } else {
    const { data, error } = await supabase.from('interviews')
      .insert(interview).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  }
})

dbRouter.delete('/interviews/:id', async (req, res) => {
  await supabase.from('interviews').delete().eq('id', req.params.id).eq('user_id', uid(req))
  res.json({ success: true })
})

// ========== 面试问答 ==========

dbRouter.get('/qa', async (req, res) => {
  const interviewId = req.query.interviewId
  if (!interviewId) return res.status(400).json({ error: '缺少 interviewId' })

  const { data, error } = await supabase.from('interview_qa')
    .select('*').eq('interview_id', interviewId).eq('user_id', uid(req))
    .order('sequence_number', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/qa', async (req, res) => {
  const { data, error } = await supabase.from('interview_qa')
    .insert({ ...req.body, user_id: uid(req) }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.put('/qa/:id', async (req, res) => {
  await supabase.from('interview_qa')
    .update(req.body).eq('id', req.params.id).eq('user_id', uid(req))
  res.json({ success: true })
})

// ========== 公司题库 ==========

dbRouter.get('/company-questions', async (req, res) => {
  const { data, error } = await supabase.from('company_question_bank')
    .select('*').eq('user_id', uid(req)).order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/company-questions', async (req, res) => {
  const { data, error } = await supabase.from('company_question_bank')
    .insert({ ...req.body, user_id: uid(req) }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})
