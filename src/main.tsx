import LandingPage from './LandingPage/LandingPage.tsx';
import App from './App.tsx'; // Importa tu App principal
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta para la Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Todas las rutas de la aplicación principal con /* */}
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  </StrictMode>
);