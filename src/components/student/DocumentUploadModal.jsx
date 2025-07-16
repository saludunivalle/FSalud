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
  useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Description
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../context/DocumentContext';
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

const DocumentUploadModal = ({ open, onClose, selectedDocumentId, documentName }) => {
  const theme = useTheme();
  const { user } = useUser();
  const { documentTypes, refreshDocuments, userDocuments, setUserDocuments } = useDocuments();

  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fileInputRef = useRef(null);

  // Base URL para API
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  useEffect(() => {
    if (open) {
      setExpeditionDate('');
      setExpirationDate(''); // Clear expiration date on open
      setFileUrl('');
      setSuccess(false);
      setError('');
      setLoading(false);
      setRefreshing(false);

      if (selectedDocumentId && Array.isArray(documentTypes)) {
        const doc = documentTypes.find(doc => doc.id_tipoDoc === selectedDocumentId);
        if (doc) {
          console.log("Document Type Info Found:", doc);
          setDocumentInfo(doc);
        } else {
          console.warn(`Document type info not found for ID: ${selectedDocumentId}`);
          setDocumentInfo(null);
        }
      } else {
        console.log("Modal opened without selectedDocumentId or documentTypes not ready.");
        setDocumentInfo(null);
      }
    }
  }, [open, selectedDocumentId, documentTypes]);

  useEffect(() => {
    if (!fileUrl) {
      return;
    }

    // No longer need to read file as it's a URL
    // const reader = new FileReader();
    // reader.onloadend = () => setPreviewUrl(reader.result);
    // reader.readAsDataURL(file);

    return () => {};
  }, [fileUrl]);

  const handleFileChange = (event) => {
    // This function is no longer needed for file selection
    // const selectedFile = event.target.files[0];
    // const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    // if (selectedFile && !validTypes.includes(selectedFile.type)) {
    //   setError('Formato de archivo no válido. Por favor, sube un PDF o una imagen (JPG, PNG).');
    //   setFile(null);
    //   setPreviewUrl('');
    //   return;
    // }
    // if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
    //   setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
    //   setFile(null);
    //   setPreviewUrl('');
    //   return;
    // }
    // setFile(selectedFile);
    setError('');
  };

  // Función para obtener los documentos del usuario
  const getUserDocsDirectly = async () => {
    try {
      if (!user || !user.id) {
        console.error("No hay información de usuario disponible para obtener documentos");
        return null;
      }

      const response = await axios.get(
        `${BASE_URL}/getUserDocuments`, 
        { 
          params: { userId: user.id },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('google_token')}`
          }
        }
      );
      
      // Verificar estructura de respuesta
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Formato inesperado en la respuesta de getUserDocuments:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error obteniendo documentos de usuario:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!selectedDocumentId) {
      setError('Error interno: Falta el ID del tipo de documento.');
      return;
    }
    if (!expeditionDate) {
      setError('La fecha de expedición es requerida.');
      return;
    }
    if (documentInfo?.vence === 'si' && !expirationDate) {
      setError('La fecha de vencimiento es requerida para este documento.');
      return;
    }
    if (!fileUrl) {
      setError('Pega la URL del archivo.');
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
    // Construir el objeto de datos para JSON
    const data = {
      userId: user.id,
      documentType: selectedDocumentId,
      expeditionDate,
      userName: user.name || user.email?.split('@')[0] || 'UnknownUser',
      userEmail: user.email || 'unknown@example.com',
      fileUrl,
    };
    if (expirationDate && documentInfo?.vence === 'si') {
      data.expirationDate = expirationDate;
    }
    setLoading(true);
    try {
      const uploadUrl = `${BASE_URL}/api/documentos/subir`;
      const response = await axios.post(uploadUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('google_token')}`
        }
      });
      if (response.data?.success) {
        setSuccess(true);
        setRefreshing(true);
        const updatedDocs = await getUserDocsDirectly();
        if (updatedDocs) {
          setUserDocuments(updatedDocs);
        } else {
          try {
            await refreshDocuments();
          } catch (refreshError) {
            console.error('Error al actualizar documentos:', refreshError);
          }
        }
        setRefreshing(false);
      } else {
        setError(response.data?.details || response.data?.error || 'Ocurrió un error inesperado en el servidor.');
      }
    } catch (error) {
      console.error('Error during document upload request:', error);
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

  const userDoc = Array.isArray(userDocuments) ? userDocuments.find(doc => doc.id_doc === selectedDocumentId) : null;
  const isApproved = userDoc && (userDoc.estado?.toLowerCase() === 'aprobado' || userDoc.estado?.toLowerCase() === 'cumplido');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {documentName ? `Cargar / Actualizar: ${documentName}` : 'Cargar Documento'}
        <IconButton onClick={handleClose} aria-label="cerrar" disabled={loading || refreshing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box mb={3}>
            <Alert severity="info" sx={{ fontSize: '1rem', bgcolor: '#e3f2fd', color: '#1565c0', mb: 3 }}>
            <strong>Nota:</strong> El archivo debe estar en la nube (Google Drive, Dropbox, etc.) y tener permisos de acceso para cualquiera con el enlace. <br />
            <strong>¿Cómo hacerlo?</strong> En Google Drive: haz clic derecho en el archivo → "Obtener enlace" → selecciona "Cualquier persona con el enlace" y copia la URL aquí.
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
                  Tu documento ha sido enviado y está pendiente de revisión.
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
              {documentInfo && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento
                        ? `Este documento vence. Vigencia aprox.: ${documentInfo.tiempo_vencimiento} meses.`
                        : 'Este documento no requiere fecha de vencimiento.'}
                      <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>(ID: {selectedDocumentId})</span>
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

              {documentInfo?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)} // Add this
                    InputLabelProps={{ shrink: true }}
                    required
                    inputProps={{ min: expeditionDate || new Date().toISOString().split("T")[0] }}
                    disabled={isApproved}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="URL del archivo (Google Drive, Dropbox, etc.)"
                  fullWidth
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  helperText="Pega aquí el enlace al archivo. Asegúrate de que el archivo tenga permisos de acceso para cualquiera con el enlace."
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

export default DocumentUploadModal;