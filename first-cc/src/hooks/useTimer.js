import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export const MODES = {
  work: { label: '工作', defaultTime: 25 * 60 },
  shortBreak: { label: '短休息', defaultTime: 5 * 60 },
  longBreak: { label: '长休息', defaultTime: 15 * 60 }
};

const modeColors = {
  work: '#ff6b6b',
  shortBreak: '#51cf66',
  longBreak: '#339af0'
};

export { modeColors };

// formatTime 是纯函数，提取到模块级别
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const useTimer = (settings) => {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // 用 ref 持有最新值，避免闭包过期问题
  const modeRef = useRef(mode);
  const pomodoroCountRef = useRef(pomodoroCount);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { pomodoroCountRef.current = pomodoroCount; }, [pomodoroCount]);

  const getModeTime = useCallback((currentMode) => {
    switch (currentMode) {
      case 'work': return settings.workTime * 60;
      case 'shortBreak': return settings.shortBreakTime * 60;
      case 'longBreak': return settings.longBreakTime * 60;
      default: return settings.workTime * 60;
    }
  }, [settings]);

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGyhwr+Dhy3Q2Dh1Yl9fUxYQ6DhRYk9LX0pVCERBYj9HT1ZR9ExFXi8/Q1dXNzxFSU47O0NTU0c0REVKMjQ7Q1NTSzM8QEQtLjk8Q1NTSzM8QEQtLjk8');
    }
    audioRef.current.play().catch(() => {});
  }, []);

  const sendNotification = useCallback((title, body) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification({ title, body });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, []);

  // 通过 ref 读取最新值，避免闭包过期
  const handleTimerEnd = useCallback(() => {
    playSound();
    setIsRunning(false);

    const currentMode = modeRef.current;
    if (currentMode === 'work') {
      const newCount = pomodoroCountRef.current + 1;
      setPomodoroCount(newCount);
      sendNotification('番茄完成！', `已完成 ${newCount} 个番茄`);
      // switchMode 会调用 setIsRunning(false)，所以这里不重复调用
      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakTime * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakTime * 60);
      }
    } else {
      sendNotification('休息结束', '开始新的工作番茄吧！');
      setMode('work');
      setTimeLeft(settings.workTime * 60);
    }
  }, [playSound, sendNotification, settings]);

  // 使用 ref 持有 handleTimerEnd 的最新引用，避免 interval 重建
  const handleTimerEndRef = useRef(handleTimerEnd);
  useEffect(() => { handleTimerEndRef.current = handleTimerEnd; }, [handleTimerEnd]);

  // interval 只依赖 isRunning，不依赖 handleTimerEnd
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleTimerEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // 用函数式更新避免不必要的重置
  useEffect(() => {
    if (!isRunning) {
      const newTime = getModeTime(mode);
      setTimeLeft((prev) => (prev !== newTime ? newTime : prev));
    }
  }, [settings, mode, getModeTime, isRunning]);

  // 使用函数式更新，不捕获 isRunning
  const toggleTimer = useCallback(() => setIsRunning((prev) => !prev), []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getModeTime(modeRef.current));
  }, [getModeTime]);

  const skipTimer = useCallback(() => {
    handleTimerEndRef.current();
  }, []);

  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    setTimeLeft(getModeTime(newMode));
    setIsRunning(false);
  }, [getModeTime]);

  const progress = useMemo(() => 1 - (timeLeft / getModeTime(mode)), [timeLeft, mode, getModeTime]);

  // cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { mode, timeLeft, isRunning, pomodoroCount, progress, formatTime, toggleTimer, resetTimer, skipTimer, switchMode, MODES };
};