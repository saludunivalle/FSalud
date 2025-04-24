// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleLogin from '../components/auth/GoogleLogin'; // Ruta corregida
import { useUser } from '../context/UserContext';
import { Box, Typography, Alert } from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsLogin, isLogin } = useUser();
  const [error, setError] = useState('');
  
  // Verificar si hay un mensaje de error en el state (redireccionamiento)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);
  
  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isLogin) {
      // Redirigir a la página original o al dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isLogin, navigate, location]);

  return (
    <Box sx={{ padding: '20px', marginTop: '100px', textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ maxWidth: '500px', margin: '0 auto 20px' }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h5" component="h1" gutterBottom>
        Iniciar sesión con correo institucional
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ marginBottom: 3 }}>
        Por favor, utiliza tu cuenta @correounivalle.edu.co para acceder al sistema.
      </Typography>
      
      <GoogleLogin setIsLogin={setIsLogin} setUserInfo={setUser} />
    </Box>
  );
};

export default Login;