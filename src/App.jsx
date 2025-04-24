// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { UserProvider } from './context/UserContext';
import { DocumentProvider } from './context/DocumentContext';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <DocumentProvider>
          <AppRoutes />
        </DocumentProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;