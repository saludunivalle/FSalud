// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import HomePage from '../pages/Home';
import DashboardPage from '../pages/Dashboard';
import FirstLoginForm from '../components/auth/FirstLoginForm';
import NotFoundPage from '../pages/NotFound';
import Header from '../components/common/Header';
import DocumentUploader from '../components/student/DocumentUploader';
import DocumentHistory from '../components/student/DocumentHistory';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isLogin, loading, user } = useUser();

  if (loading) {
    // Optional: Show a global loading spinner here
    return <div>Cargando...</div>;
  }

  if (!isLogin) {
    return <Navigate to="/" replace />;
  }

  // Check for first login after ensuring user data is loaded
  if (user && user.isFirstLogin) {
     // Allow access only to the first login form if it's the first login
     if (window.location.pathname !== '/complete-profile') {
       return <Navigate to="/complete-profile" replace />;
     }
  } else if (window.location.pathname === '/complete-profile') {
     // If not first login, redirect away from complete-profile
     return <Navigate to="/dashboard" replace />;
  }


  return children;
};

const AppRoutes = () => {
  const { isLogin } = useUser(); // Get login status for header

  return (
    <> {/* Use a Fragment or just return the content directly */}
      {isLogin && <Header />} {/* Show header only when logged in */}
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Rutas Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
         <Route
           path="/document-history" // Added route for history
           element={
             <ProtectedRoute>
               <DocumentHistory />
             </ProtectedRoute>
           }
         />
        <Route
          path="/upload-document" // Added route for uploader
          element={
            <ProtectedRoute>
              <DocumentUploader />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute> {/* Still protected to ensure user context is loaded */}
              <FirstLoginForm />
            </ProtectedRoute>
          }
        />

        {/* Ruta Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </> // Close Fragment
  );
};

export default AppRoutes;