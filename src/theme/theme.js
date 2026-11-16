const THEME_KEY = 'ns-theme';

export function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    return 'light';
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function persistTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage can be blocked; the attribute still updates this visit */
  }
}

export function applyStoredTheme() {
  document.documentElement.dataset.theme = readTheme();
}
