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
| 目录 | `first-cc/` |
| 技术栈 | Electron + React 18 + Vite |
| 详细文档 | [first-cc/README.md](first-cc/README.md) |

基于 Electron + React 构建的桌面番茄钟应用，支持计时、任务管理、数据统计、主题切换等功能。

**快速开始：**

```bash
cd first-cc
npm install
npm run electron:dev
```

**快捷键：**

- `Ctrl+Shift+P` — 开始/暂停
- `Ctrl+Shift+S` — 跳过当前阶段
- `Ctrl+Shift+R` — 重置计时器