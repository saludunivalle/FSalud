// src/pages/Dashboard.jsx
import React from 'react';
import { useUser } from '../context/UserContext';
import DashboardComponent from '../components/Dashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const Dashboard = () => {
  const { user, loading } = useUser();

  // Mientras carga, mostramos un spinner
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Si no hay usuario, esto no debería ocurrir gracias a ProtectedRoute
  // pero lo mantenemos como precaución
  if (!user) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          No autorizado
        </Typography>
        <Typography>
          Debes iniciar sesión para acceder a esta página.
        </Typography>
      </Box>
    );
  }

  // Usar el componente Dashboard existente
  return <DashboardComponent userData={user} />;
};

export default Dashboard;