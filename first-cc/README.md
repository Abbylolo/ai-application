# 番茄钟 (Pomodoro Timer)

一个功能完整的桌面番茄钟应用，使用 Electron + React 构建。

## 功能特性

- **计时器功能**
  - 25分钟工作 / 5分钟短休息 / 15分钟长休息
  - 自定义时长设置
  - 可视化进度环
  - 自动切换工作/休息模式

- **任务管理**
  - 添加/删除任务
  - 标记完成状态
  - 关联番茄计数

- **数据统计**
  - 今日番茄数
  - 总计番茄数
  - 累计专注时间
  - 连续打卡天数

- **个性化设置**
  - 明亮/暗黑主题切换
  - 自定义工作和休息时长
  - 自动开始选项
  - 提示音开关

- **快捷键**
  - `Ctrl+Shift+P` - 开始/暂停
  - `Ctrl+Shift+S` - 跳过当前
  - `Ctrl+Shift+R` - 重置计时器

- **系统功能**
  - 系统托盘支持
  - 最小化到托盘
  - 系统通知提醒

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run electron:dev
```

## 打包构建

```bash
npm run electron:build
```

## 技术栈

- Electron
- React 18
- Vite
- React Icons

## 项目结构

```
pomodoro-timer/
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.js       # 预加载脚本
├── src/
│   ├── components/      # React 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── context/         # Context 状态管理
│   ├── styles/          # CSS 样式
│   └── assets/          # 静态资源
├── package.json
└── vite.config.js
```
