// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLogin, loading } = useUser();
  const location = useLocation();

  // Mientras verificamos la autenticación, mostramos un loader
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Verificar si el usuario está autenticado
  if (!isLogin || !user) {
    // Redirigir a login guardando la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene correo @correounivalle.edu.co
  if (!user.email?.endsWith('@correounivalle.edu.co')) {
    // Si no tiene el dominio correcto, cerrar sesión y redirigir
    localStorage.removeItem('google_token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_id');
    return (
      <Navigate
        to="/login"
        state={{ error: 'Por favor ingrese con un correo institucional (@correounivalle.edu.co)' }}
        replace
      />
    );
  }

  // Si está autenticado y tiene el correo correcto, mostrar la ruta protegida
  return children;
};

export default ProtectedRoute;