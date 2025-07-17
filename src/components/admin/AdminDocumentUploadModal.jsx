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
  Tooltip,
  useTheme,
  Avatar,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Description,
  Person
} from '@mui/icons-material';
import axios from 'axios';

// Helper function to calculate expiration date
const calculateExpirationDate = (expeditionDateStr, months) => {
  if (!expeditionDateStr || !months) return null;
  try {
    const expeditionDate = new Date(expeditionDateStr);
    expeditionDate.setMonth(expeditionDate.getMonth() + parseInt(months, 10));
    return expeditionDate.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error calculating expiration date:", e);
    return null;
  }
};

const AdminDocumentUploadModal = ({ 
  open, 
  onClose, 
  selectedDocument, 
  studentInfo,
  onDocumentUploaded,
  isApproved = false
}) => {
  const theme = useTheme();

  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [uploadDate, setUploadDate] = useState(''); // Nueva fecha de carga
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const fileInputRef = useRef(null);

  // Base URL para API
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  useEffect(() => {
    if (open) {
      setExpeditionDate('');
      setExpirationDate('');
      setUploadDate(''); // Resetear fecha de carga
      setFileUrl('');
      setSuccess(false);
      setError('');
      setLoading(false);
      setRefreshing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!fileUrl) {
      return;
    }

    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!isValidUrl(fileUrl)) {
      setError('La URL del archivo no es válida.');
      return;
    }

    return () => {};
  }, [fileUrl]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    // Debug information
    console.log('DEBUG - handleSubmit called with:', {
      selectedDocument,
      studentInfo,
      expeditionDate,
      expirationDate,
      fileUrl
    });
    if (!selectedDocument?.id) {
      setError('Error interno: No se ha seleccionado un documento válido para cargar.');
      console.error('selectedDocument recibido:', selectedDocument);
      return;
    }
    if (!studentInfo?.id && !studentInfo?.id_usuario) {
      setError('Error interno: No se ha seleccionado un estudiante válido para cargar el documento.');
      console.error('studentInfo recibido:', studentInfo);
      return;
    }
    if (!expeditionDate) {
      setError('La fecha de expedición es requerida.');
      return;
    }
    if (selectedDocument?.vence && !expirationDate) {
      setError('La fecha de vencimiento es requerida para este documento.');
      return;
    }
    if (!fileUrl) {
      setError('Pega la URL del archivo.');
      return;
    }
    if (!uploadDate) {
      setError('La fecha de carga es requerida.');
      return;
    }
    try {
      new URL(fileUrl);
    } catch {
      setError('La URL del archivo no es válida.');
      return;
    }
    const expeditionDateObj = new Date(expeditionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expeditionDateObj > today) {
      setError('La fecha de expedición no puede ser posterior a hoy.');
      return;
    }
    if (expirationDate) {
      const expirationDateObj = new Date(expirationDate);
      if (expirationDateObj < expeditionDateObj) {
        setError('La fecha de vencimiento no puede ser anterior a la fecha de expedición.');
        return;
      }
    }
    const formData = new FormData();
    const userId = studentInfo.id_usuario || studentInfo.id;
    formData.append('userId', userId);
    formData.append('documentType', selectedDocument.id);
    formData.append('expeditionDate', expeditionDate);
    if (expirationDate && selectedDocument?.vence) {
      formData.append('expirationDate', expirationDate);
    }
    formData.append('uploadDate', uploadDate); // Agregar fecha de carga
    formData.append('fileUrl', fileUrl);
    formData.append('userName', `${studentInfo.nombre} ${studentInfo.apellido}`);
    formData.append('userEmail', studentInfo.email || studentInfo.correo_usuario || 'unknown@example.com');
    formData.append('uploadedByAdmin', 'true');
    if (selectedDocument.nombre?.includes('Dosis') || selectedDocument.nombre?.includes('COVID')) {
      const doseNumber = selectedDocument.nombre.match(/Dosis (\d+)|(\d+)ª dosis|(\d+)/i)?.[1] || 
                        selectedDocument.nombre.match(/(\d+)/)?.[1] || '1';
      formData.append('numeroDosis', doseNumber);
      console.log(`Documento de dosis detectado: ${selectedDocument.nombre}, número de dosis: ${doseNumber}`);
    }

    console.log("Admin uploading document for user:", {
      userId: userId,
      documentType: selectedDocument.id,
      documentName: selectedDocument.nombre,
      studentName: `${studentInfo.nombre} ${studentInfo.apellido}`
    });

    setLoading(true);
    try {
      const uploadUrl = `${BASE_URL}/api/documentos/subir`;
      const token = localStorage.getItem('google_token');
      
      console.log('🔑 Enviando token JWT:', token ? token.substring(0, 50) + '...' : 'No token found');

      // Si solo hay fileUrl, envía como JSON:
      const data = {
        userId,
        documentType: selectedDocument.id,
        expeditionDate,
        expirationDate,
        uploadDate, // Agregar fecha de carga
        fileUrl,
        userName: `${studentInfo.nombre} ${studentInfo.apellido}`,
        userEmail: studentInfo.email || studentInfo.correo_usuario || 'unknown@example.com',
        uploadedByAdmin: true,
      };

      if (expirationDate && selectedDocument?.vence) {
        data.expirationDate = expirationDate;
      }

      if (selectedDocument.nombre?.includes('Dosis') || selectedDocument.nombre?.includes('COVID')) {
        const doseNumber = selectedDocument.nombre.match(/Dosis (\d+)|(\d+)ª dosis|(\d+)/i)?.[1] || 
                          selectedDocument.nombre.match(/(\d+)/)?.[1] || '1';
        data.numeroDosis = doseNumber;
      }

      const response = await axios.post(
        uploadUrl,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Server Response:", response.data);

      if (response.data?.success) {
        setSuccess(true);
        setRefreshing(true);
        
        // Log específico para carga por admin
        console.log('Documento cargado por admin exitosamente:', response.data);
        
        // Notificar al componente padre que se ha cargado un documento
        if (onDocumentUploaded) {
          await onDocumentUploaded();
        }
        
        setRefreshing(false);
      } else {
        const errorMsg = response.data?.details || response.data?.error || 'Ocurrió un error inesperado en el servidor.';
        console.error('Error en respuesta del servidor:', response.data);
        setError(`Error al cargar documento para el usuario: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error during admin document upload:', error);
      const backendError = error.response?.data?.details || error.response?.data?.error || error.message;
      setError(backendError || 'Error de conexión o del servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !refreshing) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Cargar Documento para Usuario
          </Typography>
          {studentInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  width: 28,
                  height: 28,
                  fontSize: '0.8rem'
                }}
              >
                {studentInfo.nombre?.charAt(0)}{studentInfo.apellido?.charAt(0)}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {studentInfo.nombre} {studentInfo.apellido}
              </Typography>
            </Box>
          )}
        </Box>
        <IconButton onClick={handleClose} aria-label="cerrar" disabled={loading || refreshing}>
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
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Este documento ya fue aprobado y no puede ser modificado.
            </Typography>
          </Box>
        ) : success ? (
          <Box textAlign="center" py={3}>
            {refreshing ? (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Actualizando información...
                </Typography>
              </>
            ) : (
              <>
                <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  ¡Documento cargado exitosamente!
                </Typography>
                <Typography variant="body1" paragraph>
                  El documento ha sido cargado para <strong>{studentInfo?.nombre} {studentInfo?.apellido}</strong> y está pendiente de revisión por otro administrador.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  El usuario recibirá una notificación cuando el documento sea revisado.
                </Typography>
                <Box mt={3}>
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    sx={{ backgroundColor: '#B22222', '&:hover': { backgroundColor: '#8B0000' } }}
                  >
                    Cerrar
                  </Button>
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Grid container spacing={3}>
              {selectedDocument && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    bgcolor: 'primary.light', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main'
                  }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <InfoIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                        {selectedDocument.nombre}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDocument.vence 
                        ? `Este documento vence. ${selectedDocument.tiempo_vencimiento ? `Vigencia aprox.: ${selectedDocument.tiempo_vencimiento} meses.` : ''}`
                        : 'Este documento no requiere fecha de vencimiento.'}
                    </Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Expedición"
                  type="date"
                  fullWidth
                  value={expeditionDate}
                  onChange={(e) => setExpeditionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                  disabled={isApproved}
                />
              </Grid>
              {selectedDocument?.vence && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    inputProps={{ min: expeditionDate || new Date().toISOString().split("T")[0] }}
                    disabled={isApproved}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Carga"
                  type="date"
                  fullWidth
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                  helperText="Fecha en la que se está cargando el documento."
                  disabled={isApproved}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="URL del archivo"
                  fullWidth
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  helperText="Pega aquí el enlace de tu documento en Google Drive."
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
            {loading ? 'Cargando...' : 'Enviar URL'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AdminDocumentUploadModal; 