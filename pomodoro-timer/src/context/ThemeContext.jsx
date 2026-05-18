import React, { createContext, useContext, useEffect } from 'react';
import { useStorage } from '../hooks/useStorage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 复用 useStorage hook，而不是自己操作 localStorage
  const [theme, setTheme] = useStorage('theme', 'dark');
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
