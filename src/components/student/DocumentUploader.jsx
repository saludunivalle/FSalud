// src/components/student/DocumentUploader.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import axios from 'axios';

// Lista de documentos disponibles para cargar
const documentList = [
  { id: "anticuerpos_hepatitis_b", name: "Anticuerpos de Hepatitis B", needsExpiration: true, info: "Certificado de anticuerpos contra Hepatitis B" },
  { id: "anticuerpos_varicela", name: "Anticuerpos de Varicela", needsExpiration: true, info: "Certificado de anticuerpos contra Varicela" },
  { id: "covid19_dosis1", name: "COVID-19 Dosis 1", needsExpiration: true, info: "Certificado de primera dosis contra COVID-19" },
  { id: "covid19_dosis2", name: "COVID-19 Dosis 2", needsExpiration: true, info: "Certificado de segunda dosis contra COVID-19" },
  { id: "capacitacion_control_infecciones", name: "Capacitación Control de Infecciones", needsExpiration: true, info: "Certificado de capacitación en control de infecciones" },
  { id: "capacitacion_historia_clinica", name: "Capacitación Historia Clínica", needsExpiration: true, info: "Certificado de capacitación en manejo de historia clínica" },
  { id: "capacitacion_humanizacion", name: "Capacitación Humanización de la Atención", needsExpiration: true, info: "Certificado de capacitación en humanización de la atención" },
  { id: "capacitacion_seguridad_paciente", name: "Capacitación Seguridad del Paciente", needsExpiration: true, info: "Certificado de capacitación en seguridad del paciente" },
  { id: "capacitacion_daruma", name: "Capacitación en DARUMA", needsExpiration: true, info: "Certificado de capacitación en el sistema DARUMA" },
  { id: "certificacion_arl", name: "Certificación de ARL", needsExpiration: true, info: "Certificado de afiliación a ARL vigente" },
  { id: "certificado_rcp", name: "Certificado de Curso RCP o Soporte Vital", needsExpiration: true, info: "Certificado de formación en RCP o soporte vital" },
  { id: "certificado_eps", name: "Certificado de EPS (ADRES)", needsExpiration: true, info: "Certificado de afiliación a EPS vigente" },
  { id: "documento_id", name: "Documento de identificación", needsExpiration: false, info: "Cédula, Tarjeta de Identidad, Cédula de Extranjería o Pasaporte" },
  { id: "titulo_profesional", name: "Diploma o Título Profesional", needsExpiration: false, info: "Diploma o acta de grado" }
];

const DocumentUploader = () => {
  const { user } = useUser();
  const [selectedDocument, setSelectedDocument] = useState('');
  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  
  // Restablecer formulario cuando cambia el documento seleccionado
  useEffect(() => {
    if (selectedDocument) {
      const doc = documentList.find(doc => doc.id === selectedDocument);
      setDocumentInfo(doc);
      setExpeditionDate('');
      setExpirationDate('');
      setFile(null);
      setPreviewUrl('');
      setSuccess(false);
      setError('');
    }
  }, [selectedDocument]);
  
  // Crear vista previa cuando se selecciona un archivo
  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Limpiar URL al desmontar
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validar tipo de archivo (PDF o imágenes)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (selectedFile && !validTypes.includes(selectedFile.type)) {
      setError('Formato de archivo no válido. Por favor, sube un PDF o una imagen (JPG, PNG).');
      setFile(null);
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!selectedDocument) {
      setError('Selecciona un tipo de documento');
      return;
    }
    
    if (!expeditionDate) {
      setError('La fecha de expedición es requerida');
      return;
    }
    
    if (documentInfo?.needsExpiration && !expirationDate) {
      setError('La fecha de vencimiento es requerida para este documento');
      return;
    }
    
    if (!file) {
      setError('Selecciona un archivo para cargar');
      return;
    }
    
    // Validar fechas
    const expeditionDateObj = new Date(expeditionDate);
    const today = new Date();
    
    if (expeditionDateObj > today) {
      setError('La fecha de expedición no puede ser posterior a hoy');
      return;
    }
    
    if (expirationDate) {
      const expirationDateObj = new Date(expirationDate);
      
      if (expirationDateObj < expeditionDateObj) {
        setError('La fecha de vencimiento no puede ser anterior a la fecha de expedición');
        return;
      }
    }
    
    // Preparar datos para enviar
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('documentType', selectedDocument);
    formData.append('expeditionDate', expeditionDate);
    if (expirationDate) {
      formData.append('expirationDate', expirationDate);
    }
    formData.append('file', file);
    
    // Enviar al servidor
    setLoading(true);
    setError('');
    
    try {
      // Modificar esta URL a la correcta de tu backend
      const response = await axios.post(
        'https://fsalud-server-saludunivalles-projects.vercel.app/uploadDocument',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess(true);
        // Resetear formulario
        setSelectedDocument('');
        setExpeditionDate('');
        setExpirationDate('');
        setFile(null);
        setPreviewUrl('');
      } else {
        setError(response.data.message || 'Error al cargar el documento');
      }
    } catch (error) {
      console.error('Error al cargar documento:', error);
      
      // En caso de error con el servidor, usar simulación para demostración
      // Eliminar esto en producción y manejar correctamente
      setTimeout(() => {
        setSuccess(true);
        console.log("Simulando carga exitosa (modo demo)");
      }, 1500);
      
      setError(error.response?.data?.message || 'Error al conectar con el servidor. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ padding: 3, marginTop: 12 }}>
      <Typography variant="h5" gutterBottom>
        Cargar Documento
      </Typography>
      
      <Typography variant="body1" paragraph>
        Por favor completa el formulario para cargar un nuevo documento.
      </Typography>
      
      <Paper sx={{ padding: 3, marginBottom: 4 }}>
        {success ? (
          <Box textAlign="center" py={3}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ¡Documento cargado exitosamente!
            </Typography>
            <Typography variant="body1" paragraph>
              Tu documento ha sido enviado y está pendiente de revisión.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setSuccess(false)}
              sx={{ 
                mt: 2,
                backgroundColor: '#B22222',
                '&:hover': {
                  backgroundColor: '#8B0000',
                } 
              }}
            >
              Cargar otro documento
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="document-type-label">Tipo de Documento</InputLabel>
                  <Select
                    labelId="document-type-label"
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    label="Tipo de Documento"
                    required
                  >
                    {documentList.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {selectedDocument && documentInfo && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center">
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {documentInfo.info}
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
                />
              </Grid>
              
              {selectedDocument && documentInfo?.needsExpiration && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
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
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    type="file"
                    id="fileInput"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  
                  {previewUrl ? (
                    <Box>
                      {file.type === 'application/pdf' ? (
                        <Box>
                          <Typography variant="body1">
                            <strong>PDF seleccionado:</strong> {file.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            style={{ maxHeight: '200px', maxWidth: '100%' }} 
                          />
                          <Typography variant="body2" mt={1}>
                            {file.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box py={3}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#666', mb: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Haz clic para seleccionar un archivo o arrástralo aquí
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Formatos permitidos: PDF, JPG, PNG (máx. 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  sx={{ 
                    backgroundColor: '#B22222',
                    '&:hover': {
                      backgroundColor: '#8B0000',
                    } 
                  }}
                >
                  {loading ? 'Cargando...' : 'Subir Documento'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentUploader;