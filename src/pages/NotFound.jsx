// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';

const NotFound = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      padding={3}
      marginTop={10}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Página no encontrada
      </Typography>
      <Typography variant="body1" paragraph>
        La página que estás buscando no existe o ha sido movida.
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/">
        Volver al Inicio
      </Button>
    </Box>
  );
};

export default NotFound;