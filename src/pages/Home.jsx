// src/pages/Home.jsx (Updated)
import React, { useEffect } from 'react'; // Added useEffect
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import GoogleLogin from '../components/auth/GoogleLogin';
import { Box, Typography, Button, Paper, Container, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(10),
  flexDirection: 'column',
  width: '100%',
  alignContent: 'center',
  marginTop: theme.spacing(10), // Reducido el margen superior
  marginLeft: 'auto',
  marginRight: 'auto', // Asegura centrado horizontal
  textAlign: 'center',
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  backgroundImage: 'linear-gradient(120deg, #e3e4e5 0%, #f5f5f5 100%)',
  opacity: 0.85,
  display: 'flex', // Usar flexbox para centrado de contenido
  justifyContent: 'center', // Centrado horizontal del contenido
  maxWidth: '550px', // Controlar el ancho máximo
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1, 4),
  borderRadius: theme.spacing(5),
  backgroundColor: '#B22222', // Color rojo sangre toro
  '&:hover': {
    backgroundColor: '#8B0000', // Un tono más oscuro al hacer hover
  },
}));

const Home = () => {
  const { isLogin, user, loading: userLoading, setUser, setIsLogin } = useUser(); // Ensure userLoading is available
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect to handle navigation after login state is confirmed and user data is loaded.
  useEffect(() => {
    if (isLogin && user && !userLoading) {
      // Determinar la ruta de destino según el rol y el estado de primer inicio de sesión
      if (user.role === 'profesor' || user.role === 'administrador') {
        // Profesores y administradores siempre van al dashboard sin completar perfil
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        // Estudiantes, verificar si es primer inicio de sesión
        if (user.isFirstLogin === true) {
          navigate('/complete-profile', { replace: true });
        } else {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      }
    }
  }, [isLogin, user, userLoading, navigate, location.state]);

  // This function is called by GoogleLogin upon successful authentication.
  const handleLoginSuccess = (googleAuthData) => {
    // The GoogleLogin component should have already invoked context updates.
    // Navigation is now handled by the useEffect above.
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
        paddingTop: 0, // Quitar padding superior
        paddingBottom: 4
      }}
    >
      {/* Mostrar mensaje de error si viene de redireccionamiento */}
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
            <GoogleLogin 
              setIsLogin={setIsLogin} 
              setUserInfo={setUser} 
              onSuccess={handleLoginSuccess}
              buttonColor="#B22222"
              showSingleButton={true}
            />
          </Box>
        ) : (
          <ActionButton
            variant="contained"
            size="large"
            onClick={() => {
              // Siempre ir al dashboard si ya está logueado
              navigate('/dashboard');
            }}
          >
            Ir al Dashboard
          </ActionButton>
        )}
      </HeroSection>
    </Container>
  );
};

export default Home;