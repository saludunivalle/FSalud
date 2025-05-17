// src/pages/Home.jsx (Updated)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import AuthForm from '../components/auth/AuthForm';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  Alert,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PersonAdd, Login, Close } from '@mui/icons-material';

const HeroSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(10),
  flexDirection: 'column',
  width: '100%',
  alignContent: 'center',
  marginTop: theme.spacing(10),
  marginLeft: 'auto',
  marginRight: 'auto',
  textAlign: 'center',
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  backgroundImage: 'linear-gradient(120deg, #e3e4e5 0%, #f5f5f5 100%)',
  opacity: 0.85,
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '550px',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.2, 3),
  borderRadius: theme.spacing(2),
  fontWeight: 'bold',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  },
}));

const Home = () => {
  const { isLogin, user, loading: userLoading, setUser, setIsLogin } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Handle navigation after login
  useEffect(() => {
    if (isLogin && user && !userLoading) {
      // Determinar la ruta de destino según el rol y el estado de primer inicio de sesión
      if (user.role === 'profesor' || user.role === 'administrador') {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        if (user.isFirstLogin === true) {
          navigate('/complete-profile', { replace: true });
        } else {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      }
    }
  }, [isLogin, user, userLoading, navigate, location.state]);

  const handleOpenAuth = () => {
    setAuthMode('login'); // Siempre abrimos con la pestaña de login por defecto
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    // Navigation will be handled by the useEffect
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
      {location.state?.error && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: '550px', 
            marginTop: 12, 
            marginBottom: -8 
          }}
        >
          {location.state.error}
        </Alert>
      )}
      
      <HeroSection elevation={0}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="#B22222" marginX={10}>
          Facultad de Salud
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Gestor documentos profesionales en escenarios de practica 
        </Typography>
        
        <Typography variant="body1" paragraph>
          Gestiona tus solicitudes y documentos de forma eficiente
        </Typography>
        
        {!isLogin ? (
          <Box sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
            <ActionButton
              variant="contained"
              size="large"
              startIcon={<Login />}
              onClick={handleOpenAuth}
              sx={{
                backgroundColor: '#B22222',
                '&:hover': {
                  backgroundColor: '#8B0000',
                },
                color: 'white',
                minWidth: '270px'
              }}
            >
              Iniciar sesión o registrarse
            </ActionButton>
          </Box>
        ) : (
          <ActionButton
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{
              backgroundColor: '#B22222',
              '&:hover': {
                backgroundColor: '#8B0000',
              },
              color: 'white',
            }}
          >
            Ir al Dashboard
          </ActionButton>
        )}
      </HeroSection>

      {/* Dialog modal for login/register */}
      <Dialog 
        open={authModalOpen} 
        onClose={handleCloseAuthModal}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 450
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={handleCloseAuthModal}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent>
          <AuthForm 
            onSuccess={handleAuthSuccess} 
            initialTab={authMode === 'login' ? 0 : 1}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Home;