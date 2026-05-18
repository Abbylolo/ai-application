import { useState, useEffect, useCallback, useRef } from 'react';

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse localStorage key "${key}":`, e);
      return defaultValue;
    }
  });

  // 跳过初始挂载时的空写入
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export const useSettings = () => {
  const [settings, setSettings] = useStorage('pomodoroSettings', {
    workTime: 25, shortBreakTime: 5, longBreakTime: 15,
    autoStartBreak: false, autoStartWork: false, soundEnabled: true
  });
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);
  return [settings, updateSettings];
};

export const useTasks = () => {
  const [tasks, setTasks] = useStorage('pomodoroTasks', []);

  const addTask = useCallback((text) => {
    const newTask = { id: crypto.randomUUID(), text, completed: false, pomodoros: 0, createdAt: new Date().toISOString() };
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, [setTasks]);

  const incrementPomodoro = useCallback((id) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, pomodoros: task.pomodoros + 1 } : task));
  }, [setTasks]);

  return { tasks, addTask, toggleTask, deleteTask, incrementPomodoro };
};

export const useHistory = () => {
  const [history, setHistory] = useStorage('pomodoroHistory', []);

  const addRecord = useCallback((record) => {
    const newRecord = { ...record, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setHistory(prev => [newRecord, ...prev].slice(0, 100));
  }, [setHistory]);

  const getStats = useCallback(() => {
    const today = new Date().toDateString();
    const todayRecords = history.filter(r => new Date(r.timestamp).toDateString() === today);
    const totalPomodoros = history.length;
    const todayPomodoros = todayRecords.length;
    const totalMinutes = history.reduce((sum, r) => sum + (r.duration || 25), 0);
    const streak = calculateStreak(history);
    return { totalPomodoros, todayPomodoros, totalMinutes, streak };
  }, [history]);

  return { history, addRecord, getStats };
};

function calculateStreak(history) {
  if (history.length === 0) return 0;

  const dates = [...new Set(history.map(r =>
    new Date(r.timestamp).toDateString()
  ))].sort((a, b) => new Date(b) - new Date(a));

  let streak = 1;
  const today = new Date().toDateString();

  if (dates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0] !== yesterday.toDateString()) return 0;
  }

  // 只解析一次，避免循环内重复创建 Date 对象
  let prevDate = new Date(dates[0]);
  for (let i = 1; i < dates.length; i++) {
    const currDate = new Date(dates[i]);
    const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
      prevDate = currDate;
    } else {
      break;
    }
  }

  return streak;
}