/* src/app/main.tsx — FSAA app layer (Vite template): providers + router wiring.
   This is the composition root of a plain-React FSAA app. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@pages/router';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>,
);