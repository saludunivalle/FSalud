import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import HomePage from '../pages/Home';
import DashboardPage from '../pages/Dashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import FirstLoginForm from '../components/auth/FirstLoginForm';
import AuthComponent from '../components/auth/AuthComponent'; // Updated import
import NotFoundPage from '../pages/NotFound';
import Header from '../components/common/Header';
import DocumentHistory from '../components/student/DocumentHistory';
import StudentDocumentManager from '../components/admin/StudentDocumentManager';

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLogin, loading, user } = useUser();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isLogin || (allowedRoles && !allowedRoles.includes(user?.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isLogin, user } = useUser();

  return (
    <>
      {isLogin && <Header userData={user} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Ruta para autenticación con correo/contraseña */}
        <Route path="/auth" element={<AuthComponent />} />

        {/* Rutas Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {(user?.role === 'profesor' || user?.role === 'administrador') ? <AdminDashboard /> : <DashboardPage />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-history"
          element={
            <ProtectedRoute>
              <DocumentHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <FirstLoginForm />
            </ProtectedRoute>
          }
        />
        {/* Ruta para documentos de estudiantes protegida por rol */}
        <Route
          path="/admin/student/:studentId"
          element={
            <ProtectedRoute allowedRoles={['administrador', 'profesor']}>
              <StudentDocumentManager />
            </ProtectedRoute>
          }
        />

        {/* Ruta Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default AppRoutes;