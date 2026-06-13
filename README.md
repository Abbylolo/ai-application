# AI Application

一个以 AI 辅助开发为特色的桌面应用集合仓库。

## 仓库说明

本项目是一个多应用集合仓库，根目录下每个独立文件夹代表一个桌面应用。
各应用拥有独立的技术栈和依赖管理，互不干扰。

### 环境要求

- Node.js 18+
- npm 9+

### 新增应用

在根目录下新建文件夹，遵循独立项目结构，包含独立的 `package.json` 和 `README.md`。

---

## 应用列表

### 番茄钟 (Pomodoro Timer)

| 项目 | 说明 |
|------|------|
| 目录 | `pomodoro-timer/` |
| 技术栈 | Electron + React 18 + Vite |
| 详细文档 | [pomodoro-timer/README.md](pomodoro-timer/README.md) |

基于 Electron + React 构建的桌面番茄钟应用，支持计时、任务管理、数据统计、主题切换等功能。

**快速开始：**

```bash
cd pomodoro-timer
npm install
npm run electron:dev
```

**快捷键：**

- `Ctrl+Shift+P` — 开始/暂停
- `Ctrl+Shift+S` — 跳过当前阶段
- `Ctrl+Shift+R` — 重置计时器

---

### 面试官 Agent (JobPrep)

| 项目 | 说明 |
|------|------|
| 目录 | `interviewer-agent/` |
| 技术栈 | Vue 3 + Vite + Express + Supabase |
| 详细文档 | [interviewer-agent/README.md](interviewer-agent/README.md) |

AI 驱动的模拟技术面试平台。支持简历解析、多难度面试（大厂/中厂/小厂）、公司定制面试、即时评分反馈、面试报告生成等功能。前后端分离架构，数据存储于 Supabase。

**快速开始：**

```bash
cd interviewer-agent/client && npm install   # 安装前端依赖
cd interviewer-agent/server && npm install   # 安装后端依赖
cd interviewer-agent/server && npm run dev   # 启动后端（端口 5200）
cd interviewer-agent/client && npm run dev   # 启动前端（端口 5199）
```

**核心功能：**
- 🤖 三种难度模拟面试（小厂/中厂/大厂），智能追问
- 📝 简历上传 + AI 解析，自动提取技能画像
- 🏢 公司定制面试（上传 JD，精准匹配岗位要求）
- 📊 面试报告 + 技能雷达图 + 数据统计分析
- 🌓 暗色/亮色主题切换
- 📱 移动端响应式适配

**页面效果：**

<img width="3024" height="1656" alt="edf11477cf9b0512a5db29184ea408e5" src="https://github.com/user-attachments/assets/2d397292-19c3-47fb-b108-36862f3d87ef" />
<img width="3024" height="1656" alt="a331c03b40302a03c5edabfb3cff5829" src="https://github.com/user-attachments/assets/041b0f58-72ae-4bba-a206-59795007ceda" />

