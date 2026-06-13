import { Router } from 'express'
import { supabase } from '../supabase.js'

export const dbRouter = Router()

// ========== 用户档案 ==========

// 获取所有档案
dbRouter.get('/profiles', async (req, res) => {
  const { data, error } = await supabase.from('user_profiles').select('*').order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// 保存档案
dbRouter.post('/profiles', async (req, res) => {
  const profile = req.body
  let result

  if (profile.id) {
    // 更新
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()
    result = { data, error }
  } else {
    // 新建
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ ...profile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()
    result = { data, error }
  }

  if (result.error) return res.status(500).json({ error: result.error.message })
  res.json(result.data)
})

// 删除档案
dbRouter.delete('/profiles/:id', async (req, res) => {
  const { error } = await supabase.from('user_profiles').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// ========== 面试记录 ==========

dbRouter.get('/interviews', async (req, res) => {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/interviews', async (req, res) => {
  const interview = req.body
  let result

  if (interview.id) {
    const { data, error } = await supabase
      .from('interviews')
      .update(interview)
      .eq('id', interview.id)
      .select()
      .single()
    result = { data, error }
  } else {
    const { data, error } = await supabase
      .from('interviews')
      .insert(interview)
      .select()
      .single()
    result = { data, error }
  }

  if (result.error) return res.status(500).json({ error: result.error.message })
  res.json(result.data)
})

dbRouter.delete('/interviews/:id', async (req, res) => {
  const { error } = await supabase.from('interviews').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// ========== 面试问答 ==========

dbRouter.get('/qa', async (req, res) => {
  const interviewId = req.query.interviewId
  if (!interviewId) return res.status(400).json({ error: '缺少 interviewId' })

  const { data, error } = await supabase
    .from('interview_qa')
    .select('*')
    .eq('interview_id', interviewId)
    .order('sequence_number', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/qa', async (req, res) => {
  const { data, error } = await supabase.from('interview_qa').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.put('/qa/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('interview_qa')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ========== 公司题库 ==========

dbRouter.get('/company-questions', async (req, res) => {
  const { data, error } = await supabase
    .from('company_question_bank')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/company-questions', async (req, res) => {
  const { data, error } = await supabase
    .from('company_question_bank')
    .insert(req.body)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ========== 模型配置 ==========

dbRouter.get('/model-configs', async (req, res) => {
  const { data, error } = await supabase
    .from('model_configs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.post('/model-configs', async (req, res) => {
  const config = req.body
  // 如果设为默认，取消其他默认
  if (config.is_default) {
    await supabase.from('model_configs').update({ is_default: false }).neq('id', config.id || '')
  }

  // upsert: 有则更新，无则插入
  const { data, error } = await supabase
    .from('model_configs')
    .upsert(config, { onConflict: 'id' })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

dbRouter.delete('/model-configs/:id', async (req, res) => {
  const { error } = await supabase.from('model_configs').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})
