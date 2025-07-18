import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Stack,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { studentDocumentManagerTheme } from './studentDocumentManagerTheme';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onClearCacheAndRetry, 
  clearCache 
}) => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={studentDocumentManagerTheme}>
      <Box sx={{ padding: 3, marginTop: 12 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <IconButton
            size="small"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              color: 'primary.main', 
              borderRadius: 1.5,
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white'
              } 
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">Error al cargar usuario</Typography>
        </Stack>
        
        <Alert 
          severity={error.includes('alta demanda') ? 'warning' : 'error'} 
          sx={{ mb: 2 }}
          action={
            error.includes('alta demanda') ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Reintentando...</Typography>
              </Box>
            ) : null
          }
        >
          {error}
        </Alert>
        
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            onClick={onRetry}
            startIcon={<Refresh />}
          >
            Reintentar
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              clearCache();
              onClearCacheAndRetry();
            }}
            startIcon={<Refresh />}
          >
            Limpiar Cache y Reintentar
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ErrorDisplay; 