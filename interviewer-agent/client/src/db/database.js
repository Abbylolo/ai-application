import Dexie from 'dexie'

const db = new Dexie('InterviewerAgentDB')

db.version(1).stores({
  // 用户档案
  userProfiles: '++id, name, position, yearsOfExperience, createdAt, updatedAt',

  // 模型配置
  modelConfigs: '++id, name, providerType, modelName, isDefault, createdAt',

  // 面试记录
  interviews: '++id, profileId, type, companyName, difficulty, status, startedAt, completedAt, averageScore',

  // 面试问答
  interviewQA: '++id, interviewId, sequenceNumber, type, isFlagged, createdAt',

  // 公司题库
  companyQuestionBank: '++id, companyName, position, source, createdAt, updatedAt',

  // 应用设置
  settings: 'key'
})

export default db
