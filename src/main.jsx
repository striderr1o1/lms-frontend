import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import App from './App.jsx';
import { applyStoredTheme } from './theme/theme.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/components.css';
import './styles/landing.css';

applyStoredTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
