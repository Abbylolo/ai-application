# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库概述

这是一个多应用集合仓库，根目录下每个独立文件夹代表一个桌面应用。各应用拥有独立的技术栈和依赖管理。

## 常用命令

### 番茄钟应用 (pomodoro-timer/)

```bash
cd pomodoro-timer
npm install                # 安装依赖
npm run dev                # 开发运行（同时启动Vite和Electron）
npm run electron:build     # 打包构建
```

### 面试官应用 (interviewer-agent/)

```bash
cd interviewer-agent/client && npm install   # 安装前端依赖
cd interviewer-agent/server && npm install   # 安装后端依赖
cd interviewer-agent/server && npm run dev   # 启动后端（端口5200）
cd interviewer-agent/client && npm run dev   # 启动前端（端口5199）
```

## 架构说明

### 番茄钟应用架构

- **技术栈**: Electron + React 18 + Vite
- **主进程**: `electron/main.js` - Electron主进程，处理窗口管理、系统托盘、全局快捷键
- **预加载脚本**: `electron/preload.js` - 安全地暴露IPC通信接口
- **渲染进程**: `src/` 目录下的React应用
  - `components/` - UI组件（Timer, Controls, TaskList, Statistics, Settings）
  - `hooks/` - 自定义Hooks（useTimer计时逻辑, useStorage本地存储）
  - `context/` - React Context状态管理（ThemeContext主题切换）
  - `App.jsx` - 应用根组件，组合所有功能模块

### 面试官应用架构 (interviewer-agent/)

- **技术栈**: Vue 3 + Vite（前端） + Express.js（后端代理）
- **前端**: `client/src/` 目录下的 Vue 3 SPA 应用
  - `pages/` - 页面组件（Home/Setup/Profile/Interview/Report/History/Company/Settings）
  - `components/chat/` - 面试聊天组件（ChatPanel/QuestionCard/AnswerInput）
  - `stores/` - Pinia 状态管理（settings/user/interview）
  - `composables/` - 组合式函数（预留）
  - `db/` - Dexie.js IndexedDB 数据库定义
  - `services/` - 后端 API 调用封装
- **后端**: `server/` 目录下的 Express.js 代理服务
  - `routes/llm.js` - 多协议 LLM 转发（Anthropic + OpenAI兼容）
  - `routes/resume.js` - 简历解析接口
  - `routes/jd.js` - 岗位描述解析接口
  - `routes/search.js` - 面经搜索接口

### 状态管理

使用React Context进行全局状态管理，主要管理：
- 主题切换（明亮/暗黑模式）
- 计时器状态（通过useTimer Hook）
- 本地数据持久化（通过useStorage Hook）

## 开发注意事项

- 每个应用目录独立，修改时需先`cd`到对应目录
- Electron应用需要同时运行Vite开发服务器和Electron主进程
- 使用`concurrently`和`wait-on`确保开发时的进程协调
- git提交按照通用规范进行，包括提交信息格式、分支管理等