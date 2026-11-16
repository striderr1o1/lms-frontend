import { createContext, useContext, useMemo, useState } from 'react';
import { persistTheme, readTheme } from './theme.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  const value = useMemo(() => ({
    theme,
    toggleTheme() {
      setTheme((current) => {
        const next = current === 'dark' ? 'light' : 'dark';
        persistTheme(next);
        return next;
      });
    },
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
