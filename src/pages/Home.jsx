import React, { useEffect, useState } from 'react'; // Added useState
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import GoogleLogin from '../components/auth/GoogleLogin';
import AuthForm from '../components/auth/AuthForm'; // Importar el formulario de autenticación

import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  Alert,
  Modal,
  Fade,
  Backdrop
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
  // Estado para controlar el modal de autenticación
  const [authModalOpen, setAuthModalOpen] = useState(false);
  // Estado para controlar la pestaña inicial del formulario (0: Login, 1: Register)
  const [initialTab, setInitialTab] = useState(0);

  // Handle navigation after login
  useEffect(() => {
    if (isLogin && user && !userLoading) {
      // Cerrar modal si está abierto
      setAuthModalOpen(false);
      
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

  // Función para abrir el modal
  const handleOpenAuthModal = (tabIndex = 0) => {
    setInitialTab(tabIndex);
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Esta función se llama cuando la autenticación es exitosa
  const handleAuthSuccess = (userData) => {
    // La navegación se manejará en el useEffect
    setAuthModalOpen(false);

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

          <Box sx={{ marginTop: 4 }}>
            <ActionButton
              variant="contained"
              size="large"
              onClick={() => handleOpenAuthModal(0)}
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
      {/* Modal de autenticación */}
      <Modal
        open={authModalOpen}
        onClose={handleCloseAuthModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Fade in={authModalOpen}>
          <Box>
            <AuthForm 
              onSuccess={handleAuthSuccess} 
              initialTab={initialTab}
            />
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
};

export default Home;