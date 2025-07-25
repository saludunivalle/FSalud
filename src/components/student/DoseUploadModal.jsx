import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  useTheme,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle,
  Schedule,
  Cancel,
  Close as CloseIcon,
  Description,
  VaccinesOutlined,
  Warning,
  HourglassEmpty,
  Block,
  CloudOff,
  Info as InfoIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../context/DocumentContext';
import axios from 'axios';

const DoseUploadModal = ({ open, onClose, document, documentName, existingDocument = null }) => {
  const theme = useTheme();
  const { user } = useUser();
  const { refreshDocuments, userDocuments, getDocumentStatus } = useDocuments();

  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para validación visual
  const [expeditionDateError, setExpeditionDateError] = useState(false);
  const [expirationDateError, setExpirationDateError] = useState(false);
  const [fileUrlError, setFileUrlError] = useState(false);
  
  const fileInputRef = useRef(null);

  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  // Determinar si es una actualización
  const isUpdate = existingDocument && (existingDocument.ruta_archivo || existingDocument.fecha_cargue);

  useEffect(() => {
    if (open) {
      // Si es una actualización, pre-llenar los campos con datos existentes
      if (isUpdate && existingDocument) {
        setExpeditionDate(existingDocument.fecha_expedicion || '');
        setExpirationDate(existingDocument.fecha_vencimiento || '');
        setFileUrl(existingDocument.ruta_archivo || '');
      } else {
        setExpeditionDate('');
        setExpirationDate('');
        setFileUrl('');
      }
      setSuccess(false);
      setError('');
      setLoading(false);
    }
  }, [open, isUpdate, existingDocument]);

  useEffect(() => {
    if (expeditionDate && document?.vence === 'si' && document?.tiempo_vencimiento) {
      const expDate = new Date(expeditionDate);
      expDate.setDate(expDate.getDate() + (parseInt(document.tiempo_vencimiento) * 7)); // Convertir semanas a días
      setExpirationDate(expDate.toISOString().split('T')[0]);
    }
  }, [expeditionDate, document]);

  const getDoseStatus = () => {
    if (!document || !userDocuments) return 'Sin cargar';
    
    const userDoc = userDocuments.find(ud => {
      if (ud.id_doc !== document.id_doc) return false;
      return parseInt(ud.numero_dosis) === document.doseNumber;
    });
    
    return getDocumentStatus(userDoc, document);
  };

  const getStatusChip = (status) => {
    let icon, color, label, bgColor;

    switch (status?.toLowerCase()) {
      case 'cumplido':
      case 'aprobado':
        icon = <CheckCircle sx={{ fontSize: 16 }} />;
        color = '#4CAF50';
        bgColor = '#E8F5E8';
        label = 'Aprobado';
        break;
      case 'rechazado':
        icon = <Cancel sx={{ fontSize: 16 }} />;
        color = '#F44336';
        bgColor = '#FFEBEE';
        label = 'Rechazado';
        break;
      case 'expirado':
      case 'vencido':
        icon = <Warning sx={{ fontSize: 16 }} />;
        color = '#FF9800';
        bgColor = '#FFF8E1';
        label = 'Vencido';
        break;
      case 'sin revisar':
      case 'pendiente':
        icon = <HourglassEmpty sx={{ fontSize: 16 }} />;
        color = '#2196F3';
        bgColor = '#E3F2FD';
        label = 'Pendiente';
        break;
      case 'no aplica':
        icon = <Block sx={{ fontSize: 16 }} />;
        color = '#9E9E9E';
        bgColor = '#F5F5F5';
        label = 'No Aplica';
        break;
      case 'sin cargar':
      default:
        icon = <CloudOff sx={{ fontSize: 16 }} />;
        color = '#9E9E9E';
        bgColor = '#F5F5F5';
        label = 'Sin Cargar';
        break;
    }

    return (
      <Chip
        icon={icon}
        label={label}
        sx={{
          backgroundColor: bgColor,
          color: color,
          border: `1px solid ${color}20`,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 28,
          '& .MuiChip-icon': {
            color: color,
          },
        }}
      />
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Reset error states
    setExpeditionDateError(false);
    setExpirationDateError(false);
    setFileUrlError(false);
    
    let hasErrors = false;
    
    try {
      if (!expeditionDate) {
        setExpeditionDateError(true);
        throw new Error('La fecha de expedición es requerida');
      }
      const expDate = new Date(expeditionDate);
      const today = new Date();
      if (expDate > today) {
        setExpeditionDateError(true);
        throw new Error('La fecha de expedición no puede ser futura');
      }
      if (!fileUrl) {
        setFileUrlError(true);
        throw new Error('Por favor, pega la URL del archivo');
      }
      // Validar que la URL sea válida
      try {
        new URL(fileUrl);
      } catch {
        setFileUrlError(true);
        throw new Error('La URL del archivo no es válida');
      }
      // Construir el objeto de datos para JSON
      const data = {
        userId: user.id,
        documentType: document.id_doc,
        expeditionDate,
        userName: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
        userEmail: user.email,
        numeroDosis: document.doseNumber,
        fileUrl,
      };
      if (document.vence === 'si' && document.tiempo_vencimiento) {
        const expDate = new Date(expeditionDate);
        expDate.setDate(expDate.getDate() + (parseInt(document.tiempo_vencimiento) * 7)); // Convertir semanas a días
        const formattedExpirationDate = expDate.toISOString().split('T')[0];
        data.expirationDate = formattedExpirationDate;
      }
      const token = localStorage.getItem('google_token');
      const response = await axios.post(`${BASE_URL}/api/documentos/subir`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setSuccess(true);
        await refreshDocuments();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Error al subir el documento');
      }
    } catch (error) {
      setError(error.message || 'Error al subir el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setExpeditionDate('');
      setExpirationDate('');
      setFileUrl('');
      setSuccess(false);
      setError('');
      setLoading(false);
      onClose();
    }
  };

  // Si no hay document o no está abierto, no renderizar nada
  if (!document || !open) {
    return null;
  }

  const currentStatus = getDoseStatus();
  const isApproved = currentStatus?.toLowerCase() === 'aprobado' || currentStatus?.toLowerCase() === 'cumplido';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VaccinesOutlined color="primary" />
          <Typography variant="h6">
            {document?.nombre_doc} - Dosis {document.doseNumber} {isUpdate ? '(Actualizar)' : '(Cargar)'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} aria-label="cerrar" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={3}>
            <Alert severity="info" sx={{ fontSize: '1rem', bgcolor: '#e3f2fd', color: '#1565c0', mb: 3 }}>
            <strong>Nota:</strong>Sube tu archivo a Google Drive y asegura que tenga permisos de visualiación pública o para cualquiera con el enlace, y pega la URL aquí.<br />
            <strong>¿Cómo hacerlo?</strong> En Google Drive: haz clic derecho en el archivo → "Obtener enlace" → selecciona "Cualquier persona con el enlace".
            </Alert>
        </Box>
        {isApproved ? (
          <Box textAlign="center" py={3}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Este documento ya fue aprobado y no puede ser modificado.
            </Typography>
          </Box>
        ) : success ? (
          <Box textAlign="center" py={3}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ¡Documento cargado exitosamente!
            </Typography>
            <Typography variant="body1" paragraph>
              Tu documento ha sido enviado y está pendiente de revisión.
            </Typography>
            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{ 
                  backgroundColor: '#B22222', 
                  '&:hover': { backgroundColor: '#8B0000' } 
                }}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  justifyContent: 'space-between'
                }}>
                  <Box display="flex" alignItems="center">
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Estado actual de la dosis:
                    </Typography>
                  </Box>
                  {getStatusChip(currentStatus)}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Expedición"
                  type="date"
                  fullWidth
                  value={expeditionDate}
                  onChange={(e) => {
                    setExpeditionDate(e.target.value);
                    setExpeditionDateError(false);
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={expeditionDateError}
                  helperText={expeditionDateError ? 'La fecha de expedición es requerida' : ''}
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                  disabled={isApproved}
                />
              </Grid>
              {document?.vence && document.vence.toLowerCase().replace('í', 'i') === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => {
                      setExpirationDate(e.target.value);
                      setExpirationDateError(false);
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={expirationDateError}
                    helperText={expirationDateError ? 'La fecha de vencimiento es requerida' : 
                      (document?.tiempo_vencimiento ? 
                        `Se calcula automáticamente (${document.tiempo_vencimiento} semanas)` : 
                        '')}
                    disabled={isApproved}
                    inputProps={{ min: expeditionDate || new Date().toISOString().split("T")[0] }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="URL del archivo"
                  fullWidth
                  value={fileUrl}
                  onChange={e => {
                    setFileUrl(e.target.value);
                    setFileUrlError(false);
                  }}
                  required
                  error={fileUrlError}
                  helperText={fileUrlError ? 'La URL del archivo es requerida' : 'Pega aquí el enlace de tu documento en Google Drive.'}
                  placeholder="https://drive.google.com/file/d/..."
                  disabled={isApproved}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      {!success && !isApproved && (
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !fileUrl}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            sx={{
              backgroundColor: '#B22222',
              color: 'white',
              '&:hover': {
                backgroundColor: '#8B0000',
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
              }
            }}
          >
            {loading ? 'Cargando...' : (isUpdate ? 'Actualizar URL' : 'Enviar URL')}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DoseUploadModal; 