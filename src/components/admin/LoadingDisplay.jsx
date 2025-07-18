import React from 'react';
import {
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

const LoadingDisplay = ({ modoSaturado }) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress />
      <Typography variant="body1" sx={{ ml: 2 }}>
        {modoSaturado 
          ? 'Hay demasiadas solicitudes en la aplicación, esto puede tomar unos minutos...'
          : 'Cargando datos del estudiante...'
        }
      </Typography>
    </Box>
  );
};

export default LoadingDisplay; 