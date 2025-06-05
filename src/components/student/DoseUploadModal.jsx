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

const DoseUploadModal = ({ open, onClose, document, documentName }) => {
  const theme = useTheme();
  const { user } = useUser();
  const { refreshDocuments, userDocuments, getDocumentStatus } = useDocuments();

  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  useEffect(() => {
    if (open) {
      setExpeditionDate('');
      setExpirationDate('');
      setFile(null);
      setPreviewUrl('');
      setSuccess(false);
      setError('');
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  useEffect(() => {
    if (expeditionDate && document?.vence === 'si' && document?.tiempo_vencimiento) {
      const expDate = new Date(expeditionDate);
      expDate.setMonth(expDate.getMonth() + parseInt(document.tiempo_vencimiento));
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

    if (!expeditionDate) {
      setError('La fecha de expedición es requerida.');
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

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id_usuario || user.id);
      formData.append('documentType', document.id_doc);
      formData.append('numeroDosis', document.doseNumber);
      formData.append('expeditionDate', expeditionDate);
      if (expirationDate) {
        formData.append('expirationDate', expirationDate);
      }
      formData.append('userName', user.name || user.nombre || 'Usuario');
      formData.append('userEmail', user.email || 'unknown@example.com');

      console.log("Submitting FormData to /api/documentos/subir (DoseUploadModal):");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? `${value.name} (${value.type}, ${value.size} bytes)` : value}`);
      }

      const response = await axios.post(`${BASE_URL}/api/documentos/subir`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Server Response (DoseUploadModal):", response.data);

      if (response.data.success) {
        setSuccess(true);
        await refreshDocuments();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Error al cargar el documento');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setExpeditionDate('');
      setExpirationDate('');
      setFile(null);
      setPreviewUrl('');
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
            {document?.nombre_doc} - Dosis {document.doseNumber}
          </Typography>
        </Box>
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
              {/* Estado actual de la dosis */}
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
                  onChange={(e) => setExpeditionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                />
              </Grid>

              {document?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!!document?.tiempo_vencimiento}
                    helperText={document?.tiempo_vencimiento ? 
                      `Se calcula automáticamente (${document.tiempo_vencimiento} meses)` : 
                      'Opcional'}
                    inputProps={{ min: expeditionDate || new Date().toISOString().split("T")[0] }}
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
                  onClick={() => fileInputRef.current?.click()}
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
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <Box>
                      {file?.type === 'application/pdf' ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexDirection: 'column' 
                        }}>
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
                            style={{ 
                              maxHeight: '200px', 
                              maxWidth: '100%', 
                              display: 'block', 
                              margin: '0 auto' 
                            }}
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

export default DoseUploadModal; 