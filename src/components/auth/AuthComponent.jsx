import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

const AuthComponent = () => {
  // Hooks
  const navigate = useNavigate();
  const { login } = useUser();
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API URL
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';
  const GOOGLE_CLIENT_ID = '340874428494-ot9uprkvvq4ha529arl97e9mehfojm5b.apps.googleusercontent.com';

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
    setError('');
    
    try {
      const idToken = response.credential;
      
      const result = await axios.post(`${BASE_URL}/api/auth/google`, { 
        idToken: idToken 
      });
      
      if (result.data.success) {
        login(result.data);
        
        if (result.data.user.isFirstLogin) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error en autenticación con Google:', err);
      setError(err.response?.data?.error || 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Error al cargar Google API. Por favor, intenta de nuevo más tarde.');
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 450, mx: 'auto', p: 4, boxShadow: 3 }}>
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
        Accede a tu cuenta
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <Google />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ 
            py: 1.5,
            fontSize: '1rem',
            borderColor: '#dadce0',
            color: '#3c4043',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              borderColor: '#dadce0'
            }
          }}
        >
          {loading ? 'Autenticando...' : 'Continuar con Google'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Utiliza tu cuenta de Google para acceder al sistema
        </Typography>
      </Box>
    </Card>
  );
};

export default AuthComponent;