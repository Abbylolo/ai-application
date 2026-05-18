import React, { useEffect, useState, useRef, useMemo } from 'react';
import Timer from './components/Timer';
import Controls from './components/Controls';
import TaskList from './components/TaskList';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import { useTimer } from './hooks/useTimer';
import { useSettings, useTasks, useHistory } from './hooks/useStorage';
import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon, FiSettings, FiList, FiBarChart2 } from 'react-icons/fi';

function App() {
  const [settings, updateSettings] = useSettings();
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const { history, addRecord, getStats } = useHistory();
  const { isDark, toggleTheme } = useTheme();
  const timer = useTimer(settings);
  const [activePanel, setActivePanel] = useState(null);

  // 只在 history 变化时重新计算统计
  const stats = useMemo(() => getStats(), [history]);

  // 用 ref 持有 timer 的最新引用，IPC 监听器只注册一次
  const timerRef = useRef(timer);
  useEffect(() => { timerRef.current = timer; });

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setTitle(`番茄钟 - ${timer.formatTime(timer.timeLeft)}`);
    }
  }, [timer.timeLeft]);

  // IPC 监听器只注册一次，通过 ref 调用最新方法
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleToggle = () => timerRef.current.toggleTimer();
    const handleSkip = () => timerRef.current.skipTimer();
    const handleReset = () => timerRef.current.resetTimer();

    window.electronAPI.onToggleTimer(handleToggle);
    window.electronAPI.onSkipTimer(handleSkip);
    window.electronAPI.onResetTimer(handleReset);

    return () => {
      window.electronAPI.removeAllListeners('toggle-timer');
      window.electronAPI.removeAllListeners('skip-timer');
      window.electronAPI.removeAllListeners('reset-timer');
    };
  }, []); // 空依赖，只注册一次

  useEffect(() => {
    if (timer.mode === 'work' && !timer.isRunning && timer.timeLeft === settings.workTime * 60) return;
    if (timer.mode === 'work' && timer.timeLeft === 0) {
      addRecord({ mode: timer.mode, duration: settings.workTime, completed: true });
    }
  }, [timer.mode, timer.timeLeft]);

  const panelToggle = (panel) => setActivePanel(activePanel === panel ? null : panel);

  return (
    <div className="app">
      <div className="app-header">
        <div className="title-bar">番茄钟</div>
        <div className="header-actions">
          <button
            className={`icon-btn ${activePanel === 'tasks' ? 'active' : ''}`}
            onClick={() => panelToggle('tasks')}
            title="任务列表"
          >
            <FiList />
          </button>
          <button
            className={`icon-btn ${activePanel === 'stats' ? 'active' : ''}`}
            onClick={() => panelToggle('stats')}
            title="统计"
          >
            <FiBarChart2 />
          </button>
          <button
            className={`icon-btn ${activePanel === 'settings' ? 'active' : ''}`}
            onClick={() => panelToggle('settings')}
            title="设置"
          >
            <FiSettings />
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="切换主题">
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </div>

      <div className="app-content">
        {activePanel === 'tasks' && (
          <TaskList tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
        )}
        {activePanel === 'stats' && <Statistics stats={stats} />}
        {activePanel === 'settings' && <Settings settings={settings} onUpdate={updateSettings} />}

        <div className="timer-container">
          <Timer
            timeLeft={timer.timeLeft}
            progress={timer.progress}
            mode={timer.mode}
            formatTime={timer.formatTime}
            MODES={timer.MODES}
          />

          <Controls
            isRunning={timer.isRunning}
            onToggle={timer.toggleTimer}
            onReset={timer.resetTimer}
            onSkip={timer.skipTimer}
          />

          <div className="mode-switcher">
            {Object.entries(timer.MODES).map(([key, { label }]) => (
              <button
                key={key}
                className={`mode-btn ${timer.mode === key ? 'active' : ''}`}
                onClick={() => timer.switchMode(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pomodoro-count">
            已完成 {timer.pomodoroCount} 个番茄
          </div>
        </div>
      </div>

      <div className="shortcuts-hint">
        <span>Ctrl+Shift+P: 开始/暂停</span>
        <span>Ctrl+Shift+S: 跳过</span>
        <span>Ctrl+Shift+R: 重置</span>
      </div>
    </div>
  );
}

export default App;
