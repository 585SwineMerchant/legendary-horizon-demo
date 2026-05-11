import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { LhErrorBoundary } from './components/LhErrorBoundary';
import { applyLhAccessibilityPrefsToDocument, loadLhAccessibilityPrefs } from './lib/lhAccessibilityPrefs';
import { preloadCoreCatalogMedia } from './services/assetCatalog';
import './styles/global.css';

applyLhAccessibilityPrefsToDocument(loadLhAccessibilityPrefs());
preloadCoreCatalogMedia();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LhErrorBoundary>
      <App />
    </LhErrorBoundary>
  </StrictMode>,
);
