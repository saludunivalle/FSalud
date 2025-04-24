import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import GoogleLogin from '../components/auth/GoogleLogin';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
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
  const { isLogin, user, setUser, setIsLogin } = useUser();
  const navigate = useNavigate();
  
  // Esta función se llamará cuando la autenticación sea exitosa
  const handleLoginSuccess = (userData) => {
    navigate('/dashboard');
  };
  
  return (
    <Container 
      maxWidth="md" 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        alignItems: 'center',
        paddingTop: 0, // Quitar padding superior
        paddingBottom: 4
      }}
    >
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
            onClick={() => navigate('/dashboard')}
          >
            Ir al Dashboard
          </ActionButton>
        )}
      </HeroSection>
    </Container>
  );
};

export default Home;