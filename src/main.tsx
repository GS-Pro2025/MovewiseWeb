import LandingPage from './LandingPage/LandingPage.tsx';
import App from './App.tsx';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";

const AppWithRoutes = () => (
  <StrictMode>
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
    <SpeedInsights /> 
  </StrictMode>
);

const container = document.getElementById('root')!;

// react-snap pre-renderiza usando ReactDOM.render()
// En producción, necesitamos usar hydrateRoot() para "hidratar" el HTML pre-renderizado
if (container.hasChildNodes()) {
  // Si el container ya tiene contenido (pre-renderizado), usar hydrate
  hydrateRoot(container, <AppWithRoutes />);
} else {
  // Si no hay contenido (desarrollo), usar render normal
  createRoot(container).render(<AppWithRoutes />);
}