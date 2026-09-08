import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pushNotificationClient.ts';

// Automatically register Service Worker for PWA installation & Web Push
if (typeof window !== 'undefined') {
  registerServiceWorker();

  // Automatically reload to get latest Vercel deployment bundles if an old cached chunk 404s
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Dynamic chunk preload failed due to new deployment, reloading page...', event);
    window.location.reload();
  });
}

const mountApp = () => {
  let rootElement = document.getElementById('root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

