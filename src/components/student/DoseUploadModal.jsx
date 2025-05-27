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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  IconButton,
  useTheme,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle,
  Schedule,
  Cancel,
  Close as CloseIcon,
  Description,
  VaccinesOutlined,
  FileUpload,
  ExpandMore,
  Visibility,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../context/DocumentContext';
import axios from 'axios';

const DoseUploadModal = ({ open, onClose, document, documentName }) => {
  const theme = useTheme();
  const { user } = useUser();
  const { refreshDocuments, userDocuments, getDocumentStatus } = useDocuments();

  const [selectedDose, setSelectedDose] = useState('');
  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  // Obtener el número total de dosis del documento con validación
  const totalDoses = document?.dosis ? parseInt(document.dosis) : 1;

  useEffect(() => {
    if (open) {
      setSelectedDose('');
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

  const getDoseStatus = (doseNumber) => {
    if (!document || !userDocuments) return 'Sin cargar';
    
    const isCovid = document?.nombre_doc?.toLowerCase().includes('covid');
    
    const userDoc = userDocuments.find(ud => {
      if (ud.id_doc !== document.id_doc) return false;
      
      if (isCovid) {
        // Para COVID, comparar como string
        return ud.numero_dosis === doseNumber.toString();
      } else {
        // Para otros documentos, comparar como número
        return parseInt(ud.numero_dosis) === doseNumber;
      }
    });
    
    return getDocumentStatus(userDoc, document);
  };

  const getDoseStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'aprobado':
      case 'cumplido': 
        return 'success';
      case 'pendiente':
      case 'sin revisar': 
        return 'warning';
      case 'rechazado':
      case 'rechazada': 
        return 'error';
      case 'vencido': 
        return 'error';
      default: 
        return 'default';
    }
  };

  const getDoseStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'aprobado':
      case 'cumplido': 
        return <CheckCircle />;
      case 'pendiente':
      case 'sin revisar': 
        return <Schedule />;
      case 'rechazado':
      case 'rechazada': 
        return <Cancel />;
      case 'vencido': 
        return <ErrorIcon />;
      default: 
        return <CloudUploadIcon />;
    }
  };

  const getStatusDisplayText = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'aprobado':
      case 'cumplido': 
        return 'Completada';
      case 'pendiente':
      case 'sin revisar': 
        return 'En revisión';
      case 'rechazado':
      case 'rechazada': 
        return 'Rechazada';
      case 'vencido': 
        return 'Vencida';
      case 'sin cargar':
      default: 
        return 'Sin cargar';
    }
  };

  // Obtener todas las dosis cargadas para este documento
  const getUploadedDoses = () => {
    if (!document || !userDocuments) return [];
    
    return userDocuments.filter(ud => ud.id_doc === document.id_doc);
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

    if (totalDoses > 1 && !selectedDose) {
      setError('Por favor selecciona una dosis.');
      return;
    }

    if (!expeditionDate) {
      setError('La fecha de expedición es requerida.');
      return;
    }

    if (!file) {
      setError('Selecciona un archivo para cargar.');
      return;
    }

    // Para COVID, permitir texto libre; para otros, validar número
    const isCovid = document?.nombre_doc?.toLowerCase().includes('covid');
    let doseNumber;
    
    if (totalDoses > 1) {
      if (isCovid) {
        // Para COVID, usar el texto tal como está
        doseNumber = selectedDose;
      } else {
        // Para otros documentos, convertir a número y validar
        doseNumber = parseInt(selectedDose);
        if (!doseNumber || doseNumber < 1 || doseNumber > totalDoses) {
      setError('Error: Número de dosis inválido.');
      return;
        }
      }
    } else {
      doseNumber = 1;
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
    formData.append('documentType', document.id_doc);
    if (totalDoses > 1) {
      formData.append('numeroDosis', doseNumber);
    }
    formData.append('expeditionDate', expeditionDate);
    
    if (expirationDate && document.vence === 'si') {
      formData.append('expirationDate', expirationDate);
    }
    
    formData.append('file', file);
    formData.append('userName', user.name || user.email?.split('@')[0] || 'UnknownUser');
    formData.append('userEmail', user.email || 'unknown@example.com');

    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/documentos/subir`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('google_token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          refreshDocuments();
          onClose();
        }, 1500);
      } else {
        setError(response.data.error || 'Error al subir el documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.error || 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Si no hay document, no renderizar el modal
  if (!document) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h5" component="div">
          Subir {documentName}
        </Typography>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Documento subido exitosamente! Cerrando modal...
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {totalDoses > 1 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VaccinesOutlined color="primary" />
                    Seleccionar Dosis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Este documento de vacuna requiere {totalDoses} dosis. Selecciona cuál deseas cargar:
                  </Typography>
                  
                  {/* Verificar si es COVID para mostrar campo especial */}
                  {document?.nombre_doc?.toLowerCase().includes('covid') ? (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Descripción de la dosis (ej: 1ra dosis, 2da dosis, refuerzo)"
                        value={selectedDose}
                        onChange={(e) => setSelectedDose(e.target.value)}
                        placeholder="Ingresa la descripción de la dosis"
                        helperText="Para COVID-19 puedes especificar: 1ra dosis, 2da dosis, 1er refuerzo, 2do refuerzo, etc."
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Número de Dosis</InputLabel>
                    <Select
                      value={selectedDose}
                      onChange={(e) => setSelectedDose(e.target.value)}
                          label="Número de Dosis"
                    >
                      {Array.from({ length: totalDoses }, (_, i) => i + 1).map((doseNumber) => {
                        const status = getDoseStatus(doseNumber);
                        const statusText = status === 'Sin cargar' ? '' : ` (${getStatusDisplayText(status)})`;
                        
                        return (
                              <MenuItem key={`select-dose-${document?.id_doc || 'doc'}-${doseNumber}`} value={doseNumber.toString()}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <Typography>Dosis {doseNumber}{statusText}</Typography>
                              {getDoseStatusIcon(status)}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                    </Box>
                  )}
                  
                  {/* Mostrar estado de todas las dosis como información */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {document?.nombre_doc?.toLowerCase().includes('covid') ? 
                        'Dosis cargadas:' : 'Estado actual de las dosis:'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {document?.nombre_doc?.toLowerCase().includes('covid') ? (
                        // Para COVID, mostrar las dosis realmente cargadas
                        getUploadedDoses().length > 0 ? (
                          getUploadedDoses().map((userDoc, index) => {
                            const status = getDoseStatus(userDoc.numero_dosis);
                            const statusColor = getDoseStatusColor(status);
                            const statusLabel = getStatusDisplayText(status);
                            
                            return (
                              <Chip
                                key={`covid-dose-${userDoc.id || userDoc.numero_dosis || index}`}
                                icon={getDoseStatusIcon(status)}
                                label={`${userDoc.numero_dosis}: ${statusLabel}`}
                                color={statusColor}
                                size="small"
                                variant="outlined"
                              />
                            );
                          })
                        ) : (
                          <Chip
                            key="no-doses-covid"
                            label="No hay dosis cargadas"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )
                      ) : (
                        // Para documentos regulares, mostrar todas las dosis posibles
                        Array.from({ length: totalDoses }, (_, i) => i + 1).map((doseNumber) => {
                          const status = getDoseStatus(doseNumber);
                          const statusColor = getDoseStatusColor(status);
                          const statusLabel = getStatusDisplayText(status);
                          
                          return (
                            <Chip
                              key={`regular-dose-${document?.id_doc || 'doc'}-${doseNumber}`}
                              icon={getDoseStatusIcon(status)}
                              label={`Dosis ${doseNumber}: ${statusLabel}`}
                              color={statusColor}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })
                      )}
                    </Box>
                  </Box>             
                  {!selectedDose && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Por favor, selecciona una dosis para continuar
                    </Alert>
                  )}
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de expedición"
                  type="date"
                  fullWidth
                  required
                  value={expeditionDate}
                  onChange={(e) => setExpeditionDate(e.target.value)}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      transform: 'translate(14px, -9px) scale(0.75)',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)'
                      }
                    }
                  }}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      top: '8px'
                    }
                  }}
                />
              </Grid>

              {document?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        transform: 'translate(14px, -9px) scale(0.75)',
                        '&.Mui-focused': {
                          transform: 'translate(14px, -9px) scale(0.75)'
                        }
                      }
                    }}
                    helperText="Se calcula automáticamente basado en la fecha de expedición"
                    sx={{
                      '& .MuiInputLabel-root': {
                        top: '-8px'
                      }
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.primary.main}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                  onClick={() => window.document.getElementById('file-input-dose').click()}
                >
                  <input
                    id="file-input-dose"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  
                  <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    {file ? file.name : 'Seleccionar archivo'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Arrastra y suelta o haz clic para seleccionar
                  </Typography>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Formatos: PDF, JPG, PNG (máx. 5MB)
                  </Typography>
                </Box>

                {previewUrl && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    {file?.type === 'application/pdf' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Description color="primary" />
                        <Typography variant="body2">{file.name}</Typography>
                      </Box>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                      />
                    )}
                  </Box>
                )}
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !file || !expeditionDate || (totalDoses > 1 && !selectedDose)}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {loading ? 'Subiendo...' : 'Subir Documento'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DoseUploadModal; 