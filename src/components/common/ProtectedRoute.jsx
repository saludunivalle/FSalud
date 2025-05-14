// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLogin, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>; // Or a spinner component
  }

  if (!isLogin || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!user.email?.endsWith('@correounivalle.edu.co')) {
    localStorage.removeItem('google_token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    localStorage.removeItem('isFirstLogin');
    localStorage.removeItem('user_role');
    // Consider calling the logout function from UserContext if it handles more state cleanup
    return (
      <Navigate
        to="/"
        state={{ error: 'Por favor ingrese con un correo institucional (@correounivalle.edu.co)' }}
        replace
      />
    );
  }

  // Role-based access check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.toLowerCase(); // Ensure role comparison is case-insensitive
    if (!allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
      // User does not have the required role
      // Redirect to a general page (e.g., their default dashboard) or an unauthorized page
      // For simplicity, redirecting to the main dashboard.
      // You might want to show a specific "Access Denied" message or page.
      return <Navigate to="/dashboard" state={{ error: 'Acceso no autorizado para este rol.' }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;