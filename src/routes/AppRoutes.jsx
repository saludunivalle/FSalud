// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import HomePage from '../pages/Home';
import DashboardPage from '../pages/Dashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import FirstLoginForm from '../components/auth/FirstLoginForm';
import NotFoundPage from '../pages/NotFound';
import Header from '../components/common/Header';
import DocumentHistory from '../components/student/DocumentHistory';
import StudentDocumentManager from '../components/admin/StudentDocumentManager'; // Importar el componente

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isLogin, loading, user } = useUser();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isLogin) {
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

        {/* Rutas Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'profesor' ? <AdminDashboard /> : <DashboardPage />}
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
            <ProtectedRoute>
              <FirstLoginForm />
            </ProtectedRoute>
          }
        />
        {/* Nueva ruta para documentos de estudiantes */}
        <Route
          path="/admin/student/:studentId"
          element={
            <ProtectedRoute>
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