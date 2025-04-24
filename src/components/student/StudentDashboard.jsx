// src/components/student/StudentDashboard.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';

const StudentDashboard = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dashboard del Estudiante
      </Typography>
      <Typography>
        Aquí se mostrará un resumen de los documentos y solicitudes.
      </Typography>
    </Box>
  );
};

export default StudentDashboard;