// src/pages/Home.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(8),
  marginTop: theme.spacing(16), // Aumentado el espacio con respecto al header
  textAlign: 'center',
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  backgroundImage: 'linear-gradient(120deg, #e3e4e5 0%, #f5f5f5 100%)',
  opacity: 0.9, // Añadida opacidad al bloque
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1, 4),
  borderRadius: theme.spacing(5),
  backgroundColor: '#B22222', // Color rojo sangre toro
  '&:hover': {
    backgroundColor: '#8B0000', // Un poco más oscuro al hover
  },
}));

const Home = () => {
  const { isLogin, user } = useUser();
  
  return (
    <Container maxWidth="lg">
      <HeroSection elevation={0}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Gestión Documental - Área de Salud Univalle
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Sube, gestiona y consulta el estado de tus documentos de forma sencilla
        </Typography>
        
        {!isLogin ? (
          <ActionButton
            variant="contained"
            size="large"
            component={RouterLink}
            to="/login"
          >
            Iniciar Sesión
          </ActionButton>
        ) : (
          <ActionButton
            variant="contained"
            size="large"
            component={RouterLink}
            to="/dashboard"
          >
            Ir al Dashboard
          </ActionButton>
        )}
      </HeroSection>
    </Container>
  );
};

export default Home;