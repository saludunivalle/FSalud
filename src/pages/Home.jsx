import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Estilos personalizados para el contenedor de autenticación
const AuthContainer = styled(Paper)(({ theme }) => ({
  marginTop: '1rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: '2rem',
  maxWidth: '400px',
  minWidth: '320px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: '2rem',
  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.0157), 0 4px 32px 0 rgba(0,0,0,0.0157), 0 2px 64px 0 rgba(0,0,0,0.0118), 0 16px 32px 0 rgba(0,0,0,0.0118)',
  border: '1px solid rgba(0,0,0,0.08)'
}));

// Estilos para el header
const HeaderContainer = styled(Box)(({ theme }) => ({
  marginTop: '2rem',
  marginBottom: '1.5rem',
  textAlign: 'center'
}));

// Estilo del botón de Google
const GoogleButton = styled(Button)(({ theme }) => ({
  height: '3rem',
  borderRadius: '0.6rem',
  padding: '0 1.5rem',
  minWidth: '6rem',
  whiteSpace: 'nowrap',
  width: '100%',
  gap: '0.75rem',
  fontWeight: 500,
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.1)',
  color: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  display: 'inline-flex',
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  '&:hover': {
    backgroundColor: '#f8f8f8',
    boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
    transform: 'translateY(-1px)',
    border: '1px solid rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  '&.Mui-disabled': {
    backgroundColor: '#f5f5f5',
    color: 'rgba(0,0,0,0.4)',
  },
  transition: 'all 150ms cubic-bezier(0.165,0.85,0.45,1)',
}));

const Home = () => {
  const { isLogin, user, loading: userLoading, login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // UI states
  const [loginError, setLoginError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);
  
  // Google client ID
  const GOOGLE_CLIENT_ID = '1095230822376-9c1lomp0nfhrlblbr43nn30943v9af2o.apps.googleusercontent.com';
  const BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://fsalud-server-saludunivalles-projects.vercel.app' 
    : 'http://localhost:3001');

  // Initialize Google Sign-In
  useEffect(() => {
    const loadGoogleScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
          });
        }
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  // Handle Google Sign-In response
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setLoginError('');
    
    try {
      const idToken = response.credential;
      
      const result = await axios.post(`${BASE_URL}/api/auth/google`, { 
        idToken: idToken 
      });
      
      if (result.data.success) {
        login(result.data);
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      setLoginError(error.response?.data?.error || 'Error al iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar navegación después del login
  useEffect(() => {
    if (isLogin && user && !userLoading) {
      const defaultRoute = (user.role === 'admin' || user.role === 'administrador') 
        ? '/dashboard' 
        : user.isFirstLogin === true ? '/complete-profile' : '/dashboard';
      
      const from = location.state?.from?.pathname || defaultRoute;
      navigate(from, { replace: true });
    }
  }, [isLogin, user, userLoading, navigate, location.state]);

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setLoginError('Error al cargar Google API. Por favor, intenta de nuevo más tarde.');
    }
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 4
      }}
    >
      {/* Header */}
      <HeaderContainer>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="#B22222">
          Facultad de Salud
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Gestor documentos profesionales en escenarios de practica 
        </Typography>
      </HeaderContainer>
      
      {/* Error messages */}
      {loginError && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: '400px', 
            marginBottom: 2
          }}
          onClose={() => setLoginError('')}
        >
          {loginError}
        </Alert>
      )}
      
      <AuthContainer>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ color: '#333', fontWeight: 500 }}>
            Accede a tu cuenta
          </Typography>
          
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : 
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google logo" 
                style={{ height: 20, width: 20 }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDkuNWMzLjU0IDAgNi43MSAxLjIyIDkuMjEgMy42bDYuODUtNi44NUMzNS45IDIuMzggMzAuNDcgMCAyNCAwIDExLjUxIDAgMS45MiAxMC40OC0uMDIgMjMuNGwxMS42MiAxLjQ3QzEyLjY5IDE1IDEwLjU2IDkuNSAyNCA5LjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTIzLjk5IDM4Yy03LjQzIDAtMTMuNDItNS4wMS0xNS40LTExLjdoLS4wMWwtMTIuMDMgMS41MUMtMC42OSAzNy43NiAxMC43NyA0OCAyMy45OSA0OGM1LjUzIDAgMTAuOS0yLjg0IDE0Ljg5LTcuNDJsLS4wMS0uMDItNy41MS01Ljgzdi0uMDAyQzI5LjQ5IDM2Ljc4IDI2IDM4IDIzLjk5IDM4eiIvPjxwYXRoIGZpbGw9IiM0Mjg1RjQiIGQ9Ik0zOC45OSAyNGMwLTEuNDItLjM1LTMuMDktLjg0LTQuNDNIMjR2OS4xMmg5LjA2Yy0uMzcgMS41Ni0xLjU1IDQuMzctNC4zNCA2LjExbDcuNTEgNS44M2M1LTMuOSA3Ljc2LTkuODYgNy43Ni0xNi42M3oiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjMy4yIDAgNS44Ny0uNDkgOC4zOS0xLjI2IDIuNzYtLjgxIDUuMDEtMi4xOSA2Ljk3LTMuOWwtNy41MS01Ljgzcy0yLjEgMS40NS00LjMgMi4zNC03Ljg0IDIuMzRDMTAuNyAzOS41NSAyLjQ2IDI4Ljk4IDIuNDEgMjcuOWwtMTEuMTggMy4wMUMtMS4zMSAzNy44IDEwLjcxIDQ4IDI0IDQ4eiIvPjwvc3ZnPg=="
                }}
              />
            }
          >
            {loading ? 'Procesando...' : 'Continuar con Google'}
          </GoogleButton>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.85rem', 
              lineHeight: 1.5,
              textAlign: 'center',
              mt: 1
            }}
          >
            Utiliza tu cuenta de Google para acceder al sistema de gestión de documentos.
          </Typography>
        </Box>
      </AuthContainer>
    </Container>
  );
};

export default Home;