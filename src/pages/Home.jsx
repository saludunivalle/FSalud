// src/pages/Home.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Box, Typography, Button, Paper, Container, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(8),
  marginTop: theme.spacing(12),
  textAlign: 'center',
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  backgroundImage: 'linear-gradient(120deg, #e3e4e5 0%, #f5f5f5 100%)',
}));

const FeatureItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: theme.spacing(1),
  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-5px)',
    transition: 'all 0.3s ease',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1, 4),
  borderRadius: theme.spacing(5),
}));

const Home = () => {
  const { isLogin, user } = useUser();
  
  return (
    <Container maxWidth="lg">
      <HeroSection elevation={0}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Sistema de Gestión Documental
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Plataforma para gestionar solicitudes y documentos de forma eficiente y segura
        </Typography>
        {!isLogin ? (
          <ActionButton
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/login"
          >
            Iniciar Sesión
          </ActionButton>
        ) : (
          <ActionButton
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/dashboard"
          >
            Ir al Dashboard
          </ActionButton>
        )}
      </HeroSection>
      
      <Box mt={8} mb={6}>
        <Typography variant="h4" component="h2" gutterBottom textAlign="center">
          Características Principales
        </Typography>
        
        <Grid container spacing={4} mt={2}>
          <Grid item xs={12} md={4}>
            <FeatureItem>
              <Typography variant="h6" component="h3" gutterBottom>
                Gestión de Documentos
              </Typography>
              <Typography>
                Carga, actualiza y gestiona documentos de manera centralizada.
              </Typography>
            </FeatureItem>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureItem>
              <Typography variant="h6" component="h3" gutterBottom>
                Seguimiento de Solicitudes
              </Typography>
              <Typography>
                Monitoriza el estado de tus solicitudes en tiempo real.
              </Typography>
            </FeatureItem>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureItem>
              <Typography variant="h6" component="h3" gutterBottom>
                Flujos de Trabajo Simplificados
              </Typography>
              <Typography>
                Procesos optimizados para una experiencia más eficiente.
              </Typography>
            </FeatureItem>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;