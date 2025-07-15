// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { UserProvider } from './context/UserContext';
import { DocumentProvider } from './context/DocumentContext';
import { SaturationProvider } from './context/SaturationContext';

function App() {
  return (
    <BrowserRouter>
      <SaturationProvider>
        <UserProvider>
          <DocumentProvider>
            <AppRoutes />
          </DocumentProvider>
        </UserProvider>
      </SaturationProvider>
    </BrowserRouter>
  );
}

export default App;