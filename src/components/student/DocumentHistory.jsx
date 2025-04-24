// src/components/student/DocumentHistory.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';

const DocumentHistory = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>
        Historial de Documentos
      </Typography>
      <Typography>
        Aquí se mostrará el historial de documentos cargados y su estado.
      </Typography>
    </Box>
  );
};

export default DocumentHistory;