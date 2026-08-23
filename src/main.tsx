import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PwaService } from './lib/pwa';
import { StorageService } from './lib/storage';

// Initialize PWA Service and connect state tracker
PwaService.initialize();
StorageService.setOnUpdateCallback((action, description) => {
  PwaService.logAction(action, description);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
