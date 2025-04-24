import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const Dashboard = ({ userData }) => {
  return (
    <Box sx={{ padding: 3, marginTop: 12 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {userData?.name || 'Usuario'}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Solicitudes activas</Typography>
            <Typography>Ver y gestionar tus solicitudes en trámite.</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nueva solicitud</Typography>
            <Typography>Crear una nueva solicitud de actividad de extensión.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;