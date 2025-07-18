// src/components/admin/DocumentReviewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Box,
  IconButton,
  Grid,
  Divider,
  FormHelperText,
  Alert,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { reviewDocument } from '../../services/docsService';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222',
    },
    secondary: {
      main: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
    },
    warning: {
      main: '#ff9800',
      light: '#fff3e0',
    },
    error: {
      main: '#f44336',
      light: '#ffebee',
    },
    info: {
      main: '#2196f3',
      light: '#e3f2fd',
    }
  },
});

const DocumentReviewModal = ({ document, onClose, studentName }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Normaliza el estado que viene del backend a un estado de frontend estandarizado
  const getNormalizedState = (backendState) => {
    const state = backendState?.toLowerCase() || '';
    switch (state) {
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  const [estado, setEstado] = useState(() => getNormalizedState(document.estado));
  const [fechaRevision, setFechaRevision] = useState(() => document.fechaRevision || new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState(document.fechaVencimiento || '');
  const [comentario, setComentario] = useState(document.comentarios || '');
  
  const [formErrors, setFormErrors] = useState({
    estado: '',
    fechaRevision: '',
    fechaVencimiento: '',
    comentario: ''
  });

  useEffect(() => {
    // Resetear estados cuando cambia el documento
    setEstado(getNormalizedState(document.estado));
    setFechaRevision(document.fechaRevision || new Date().toISOString().split('T')[0]);
    setFechaVencimiento(document.fechaVencimiento || '');
    setComentario(document.comentarios || '');
    setSuccess(false);
    setError('');
    setFormErrors({
      estado: '',
      fechaRevision: '',
      fechaVencimiento: '',
      comentario: ''
    });
  }, [document]);

  const validateForm = () => {
    const errors = {
      estado: '',
      fechaRevision: '',
      fechaVencimiento: '',
      comentario: ''
    };
    let isValid = true;

    // Validación del estado
    if (!estado) {
      errors.estado = 'El estado es requerido';
      isValid = false;
    }

    // Validación de la fecha de revisión
    if (!fechaRevision) {
      errors.fechaRevision = 'La fecha de revisión es requerida';
      isValid = false;
    } else {
      const revisionDate = new Date(fechaRevision);
      const today = new Date();
      if (revisionDate > today) {
        errors.fechaRevision = 'La fecha de revisión no puede ser futura';
        isValid = false;
      }
    }

    // Validación de fecha de vencimiento (solo si el documento vence)
    if (document.vence) {
      if (!fechaVencimiento) {
        errors.fechaVencimiento = 'La fecha de vencimiento es requerida';
        isValid = false;
      } else if (document.fechaExpedicion) {
        const expedicionDate = new Date(document.fechaExpedicion);
        const vencimientoDate = new Date(fechaVencimiento);
        if (vencimientoDate <= expedicionDate) {
          errors.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la de expedición';
          isValid = false;
        }
      }
    }

    // Si el estado es rechazado, requerir comentario
    if (estado === 'Rechazado' && !comentario.trim()) {
      errors.comentario = 'Debe proporcionar un motivo del rechazo';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const reviewData = {
        estado: estado,
        comentario: comentario,
        fecha_revision: fechaRevision,
        ...(fechaVencimiento && { fecha_vencimiento: fechaVencimiento })
      };

      // If document is rejected, ensure there's a comment
      if (estado === 'Rechazado' && !comentario.trim()) {
        setError('Debe proporcionar un motivo del rechazo');
        setLoading(false);
        return;
      }

      await reviewDocument(document.id_usuarioDoc, reviewData);

      setSuccess(true);
      setTimeout(() => {
        onClose({
          ...document,
          estado,
          fechaRevision,
          fechaVencimiento: document.vence ? fechaVencimiento : null,
          comentarios: comentario,
          fecha_revision: fechaRevision
        });
      }, 2000);

    } catch (error) {
      console.error('Error al revisar documento:', error);
      setError(error.message || 'Ocurrió un error al guardar la revisión.');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Función para obtener el color según el estado
  const getStateColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'aprobado':
        return 'success';
      case 'rechazado':
        return 'error';
      case 'vencido':
        return 'warning';
      case 'pendiente':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Dialog 
        open={true} 
        onClose={() => !loading && !success && onClose()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center">
            <DescriptionIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Revisar Documento</Typography>
          </Box>
          <IconButton 
            onClick={() => !loading && !success && onClose()} 
            disabled={loading || success}
            size="small"
            aria-label="cerrar"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {success && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {successMessage?.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {successMessage?.message}
                  </p>
                  {successMessage?.notification && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            {successMessage?.notification}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {studentName?.split(' ')[0]?.[0]}{studentName?.split(' ')?.[1]?.[0] || ''}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {studentName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Documento: {document.nombre}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="flex-end" alignItems="center" height="100%">
                  <Chip
                    label={`Estado actual: ${document.estado || 'Sin estado'}`}
                    color={getStateColor(document.estado)}
                    variant="outlined"
                  />
                  
                  {document.rutaArchivo && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href={document.rutaArchivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ ml: 2 }}
                    >
                      Ver Documento
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.estado}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="Aprobado">Aprobado</MenuItem>
                  <MenuItem value="Rechazado">Rechazado</MenuItem>
                  <MenuItem value="Vencido">Vencido</MenuItem>
                  <MenuItem value="Pendiente">Pendiente</MenuItem>
                </Select>
                {formErrors.estado && <FormHelperText>{formErrors.estado}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de Revisión"
                type="date"
                value={fechaRevision}
                onChange={(e) => setFechaRevision(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                error={!!formErrors.fechaRevision}
                helperText={formErrors.fechaRevision}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
                InputProps={{
                  startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            {document.vence && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Vencimiento"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  error={!!formErrors.fechaVencimiento}
                  helperText={formErrors.fechaVencimiento}
                  inputProps={{ min: fechaRevision }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={document.vence ? 12 : 12} sm={document.vence ? 6 : 12}>
              <Box display="flex" flexDirection="column">
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Información adicional
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    size="small" 
                    icon={<CalendarIcon />} 
                    label={`Cargue: ${formatDate(document.fechaCargue) || 'No disponible'}`} 
                  />
                  <Chip 
                    size="small" 
                    icon={<CalendarIcon />} 
                    label={`Revisión: ${formatDate(document.fechaRevision) || 'No revisado'}`} 
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              {estado === 'Rechazado' && (
                <TextField
                  label="Observaciones"
                  multiline
                  rows={4}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  fullWidth
                  placeholder="Ingrese el motivo del rechazo..."
                  disabled={loading}
                  error={!!formErrors.comentario}
                  helperText={formErrors.comentario || 'Debe indicar el motivo del rechazo'}
                />
              )}
            </Grid>
            
            {estado === 'Rechazado' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Al rechazar un documento, es importante proporcionar un motivo claro para que el estudiante pueda corregirlo adecuadamente.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        {!success && (
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => onClose()} 
              disabled={loading}
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </ThemeProvider>
  );
};

export default DocumentReviewModal;