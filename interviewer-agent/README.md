# 🤖 面试官 Agent

> 🌐 **在线体验**: [ai-application-jobprep.vercel.app](https://ai-application-jobprep.vercel.app/)
> 🔑 **演示账号**: `demo@jobprep.com` / `demo123456`

模拟真实技术面试的 AI 应用，支持多模型、语音输入、公司特定面试。

## 功能

- 🎯 **三种难度**：小厂/中厂/大厂，不同追问策略
- 🤖 **多模型支持**：Anthropic Claude / DeepSeek / OpenAI 兼容接口，网页自由切换配置
- 📝 **简历解析**：上传 PDF/文本，AI 自动提取技能、项目、学历
- 📊 **技能画像**：雷达图 + 进度条 + 项目时间线可视化
- 💬 **对话面试**：模拟真实面试对话，支持即时点评或整体总结两种模式
- 📋 **面试报告**：Markdown + PDF 双格式导出，评分 + 薄弱点分析
- 🏢 **公司面试**：上传 JD，精准匹配岗位要求
- 🔍 **面经搜索**：网络搜索公司面试经验
- 📈 **统计分析**：分数趋势、各维度表现、高频薄弱点
- 🌙 **暗色模式**：亮色/暗色主题切换
- 📱 **移动端适配**：响应式设计
- 💾 **数据备份**：JSON 格式导入/导出

## 启动

```bash
# 1. 安装依赖
cd interviewer-agent/client && npm install
cd interviewer-agent/server && npm install

# 2. 启动后端代理服务（端口 5200）
cd server && npm run dev

# 3. 启动前端开发服务器（端口 5199）
cd client && npm run dev
```

浏览器打开 `http://localhost:5199`

## 使用流程

1. **设置页** → 配置模型（API Key + 端点 + 模型名），测试连接
2. **档案页** → 上传简历或手动填写，AI 自动解析
3. **首页** → 选择难度/公司 → 开始面试
4. **面试中** → 文字回答（支持语音输入），即时评分或整体总结
5. **结束后** → 查看报告，导出 Markdown/PDF，标记复习题

## 部署

- 前端：`client/` → Vercel/Netlify 静态托管（`npm run build` → `dist/`）
- 后端：`server/` → Railway/Render 部署 Node.js 服务

## 技术栈

| 前端 | 后端 |
|------|------|
| Vue 3 + Composition API | Express.js |
| Pinia 状态管理 | Anthropic SDK |
| Vue Router 4 | OpenAI SDK |
| Dexie.js (IndexedDB) | CORS + dotenv |
| ECharts 可视化 | |
| Web Speech API | |
