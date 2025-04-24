// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import { useUser } from '../context/UserContext';

// Componentes de estudiante (para rutas anidadas)
import StudentDashboard from '../components/student/StudentDashboard';
import DocumentUploader from '../components/student/DocumentUploader';
import DocumentHistory from '../components/student/DocumentHistory';

const AppRoutes = () => {
  const { user } = useUser();

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/" 
        element={<Layout userData={user}><Home /></Layout>} 
      />
      <Route 
        path="/login" 
        element={<Layout userData={user}><Login /></Layout>} 
      />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <Layout userData={user}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      
      {/* Rutas de documentos (anidadas y protegidas) */}
      <Route 
        path="/documentos" 
        element={
          <Layout userData={user}>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </Layout>
        }
      >
        <Route index element={<DocumentHistory />} />
        <Route path="subir" element={<DocumentUploader />} />
      </Route>
      
      {/* Ruta 404 */}
      <Route 
        path="*" 
        element={<Layout userData={user}><NotFound /></Layout>} 
      />
    </Routes>
  );
};

export default AppRoutes;