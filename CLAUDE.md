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