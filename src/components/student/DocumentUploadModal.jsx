import React, { useState, useEffect } from 'react';
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
  const { documentTypes, refreshDocuments } = useDocuments();

  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);

  useEffect(() => {
    if (open) {
      setExpeditionDate('');
      setExpirationDate('');
      setFile(null);
      setPreviewUrl('');
      setSuccess(false);
      setError('');
      setLoading(false);

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
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    return () => {};
  }, [file]);

  useEffect(() => {
    if (expeditionDate && documentInfo && documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento) {
      const calculatedDate = calculateExpirationDate(expeditionDate, documentInfo.tiempo_vencimiento);
      setExpirationDate(calculatedDate || '');
    } else if (documentInfo && documentInfo.vence !== 'si') {
      setExpirationDate('');
    } else if (!expeditionDate) {
      setExpirationDate('');
    }
  }, [expeditionDate, documentInfo]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (selectedFile && !validTypes.includes(selectedFile.type)) {
      setError('Formato de archivo no válido. Por favor, sube un PDF o una imagen (JPG, PNG).');
      setFile(null);
      setPreviewUrl('');
      return;
    }
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      setFile(null);
      setPreviewUrl('');
      return;
    }
    setFile(selectedFile);
    setError('');
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
    if (!file) {
      setError('Selecciona un archivo para cargar.');
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
    formData.append('userId', user.id);
    formData.append('documentType', selectedDocumentId);
    formData.append('expeditionDate', expeditionDate);
    if (expirationDate && documentInfo?.vence === 'si') {
      formData.append('expirationDate', expirationDate);
    }
    formData.append('file', file);
    formData.append('userName', user.name || user.email?.split('@')[0] || 'UnknownUser');
    formData.append('userEmail', user.email || 'unknown@example.com');

    console.log("Submitting FormData to /api/documentos/subir:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value instanceof File ? `${value.name} (${value.type}, ${value.size} bytes)` : value}`);
    }

    setLoading(true);
    try {
      const uploadUrl = `${process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app'}/api/documentos/subir`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('google_token')}`
        }
      });

      console.log("Server Response:", response.data);

      if (response.data?.success) {
        setSuccess(true);
        await refreshDocuments();
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
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {documentName ? `Cargar / Actualizar: ${documentName}` : 'Cargar Documento'}
        <IconButton onClick={handleClose} aria-label="cerrar" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
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
                sx={{ backgroundColor: '#B22222', '&:hover': { backgroundColor: '#8B0000' } }}
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
                />
              </Grid>

              {documentInfo?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={true}
                    helperText="Se calcula automáticamente"
                    inputProps={{ min: expeditionDate || '' }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Box
                  sx={{
                    border: `2px dashed ${error && !file ? theme.palette.error.main : '#ccc'}`,
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: previewUrl ? '#f9f9f9' : 'inherit',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                      borderColor: '#aaa'
                    }
                  }}
                  onClick={() => document.getElementById('fileInputModal').click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    type="file"
                    id="fileInputModal"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <Box>
                      {file?.type === 'application/pdf' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                          <Description sx={{ fontSize: 48, color: theme.palette.error.main, mb: 1 }} />
                          <Typography variant="body1">
                            <strong>PDF:</strong> {file.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <img
                            src={previewUrl}
                            alt="Vista previa"
                            style={{ maxHeight: '200px', maxWidth: '100%', display: 'block', margin: '0 auto' }}
                          />
                          <Typography variant="body2" mt={1}>
                            {file?.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box py={3}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#666', mb: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Haz clic o arrastra un archivo aquí
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PDF, JPG, PNG (Máx. 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !file}
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
            {loading ? 'Cargando...' : 'Subir Documento'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DocumentUploadModal;