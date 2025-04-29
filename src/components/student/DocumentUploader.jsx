// src/components/student/DocumentUploader.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  AlertTitle,
  IconButton,
  CircularProgress
} from '@mui/material';
import { CloudUpload, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../context/DocumentContext';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useLocation, useNavigate

// Componente estilizado para drag & drop
const DropZone = styled(Box)(({ theme, isDragActive, hasFile }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : hasFile ? theme.palette.success.main : theme.palette.grey[400]}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  backgroundColor: isDragActive ? theme.palette.primary.light + '20' : hasFile ? theme.palette.success.light + '20' : theme.palette.grey[50],
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '150px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
    borderColor: theme.palette.primary.main,
  }
}));

const DocumentUploader = () => {
  const { user } = useUser();
  const { refreshDocuments } = useDocuments();
  const location = useLocation(); // Get location state
  const navigate = useNavigate(); // To navigate back

  const [documents, setDocuments] = useState([]);
  // Pre-select document if passed via state
  const [selectedDocument, setSelectedDocument] = useState(location.state?.documentId || '');
  const [selectedDocumentName, setSelectedDocumentName] = useState(location.state?.documentName || ''); // Store name for display
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar lista de documentos disponibles
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          'https://fsalud-server-saludunivalles-projects.vercel.app/getDocumentos'
        );
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Manejar eventos de drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Manejar selección de archivo
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Tipo de archivo no permitido. Solo se aceptan PDF, JPEG y PNG.');
      setUploadStatus('error');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      setUploadStatus('error');
      return;
    }

    setFile(file);
    setUploadStatus(null);
    setErrorMessage('');
  };

  // Eliminar archivo seleccionado
  const handleRemoveFile = () => {
    setFile(null);
    setUploadStatus(null);
    setErrorMessage('');
  };

  const handleDocumentChange = (e) => {
    const docId = e.target.value;
    setSelectedDocument(docId);
    // Find and set the name for display if needed
    const doc = documents.find(d => d.id_doc === docId);
    setSelectedDocumentName(doc ? doc.nombre_doc : '');
  };

  // Función para subir el archivo
  const handleUpload = async () => {
    if (!selectedDocument || !file || !user?.id) {
      setErrorMessage('Por favor seleccione un documento y un archivo para cargar.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    // Ensure correct field names match backend ('file', 'userId', 'documentId')
    formData.append('file', file);
    formData.append('id_usuario', user.id); // Match backend controller: expects id_usuario
    formData.append('id_doc', selectedDocument); // Match backend controller: expects id_doc

    try {
      // Realizar la carga con seguimiento de progreso
      const response = await axios.post(
        // Ensure this URL is correct and matches your deployed backend endpoint for uploads
        'https://fsalud-server-saludunivalles-projects.vercel.app/subirDocumento', // Corrected endpoint based on controller
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
            // Add Authorization header if your upload endpoint requires it
            // 'Authorization': `Bearer ${localStorage.getItem('google_token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      setUploadStatus('success');
      setFile(null);
      // Optionally reset selectedDocument or keep it if user might upload another version
      // setSelectedDocument('');
      // setSelectedDocumentName('');

      if (refreshDocuments) {
        await refreshDocuments(); // Ensure context is updated
      }

      // Optional: Show success message longer or navigate back after a delay
      setTimeout(() => {
          setUploadStatus(null); // Clear success message after a few seconds
          // navigate('/dashboard'); // Optionally navigate back
      }, 3000);


    } catch (error) {
      setUploadStatus('error');
      // Use error message from backend response if available
      setErrorMessage(error.response?.data?.error || error.message || 'Error al cargar el documento. Intente nuevamente.');
      console.error('Error uploading document:', error.response?.data || error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ padding: 3, marginTop: 12 }}>
      <Typography variant="h5" gutterBottom>
        {/* Dynamically set title based on whether it's a new upload or update */}
        {location.state?.documentId ? `Cargar / Actualizar: ${selectedDocumentName}` : 'Cargar Documento'}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Seleccione el documento que desea cargar y luego adjunte el archivo correspondiente.
          Los formatos permitidos son PDF, JPEG y PNG. Tamaño máximo: 5MB.
        </Typography>
        
        {/* Alertas de estado */}
        {uploadStatus === 'success' && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setUploadStatus(null)}
              >
                <Cancel fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>¡Documento cargado exitosamente!</AlertTitle>
            El documento ha sido enviado para revisión.
          </Alert>
        )}
        
        {uploadStatus === 'error' && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setUploadStatus(null)}
              >
                <Cancel fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Selector de documento */}
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!!location.state?.documentId}> {/* Disable if doc is pre-selected */}
              <InputLabel id="document-select-label">Tipo de Documento</InputLabel>
              <Select
                labelId="document-select-label"
                id="document-select"
                value={selectedDocument}
                label="Tipo de Documento"
                onChange={handleDocumentChange}
                disabled={isUploading || isLoading || !!location.state?.documentId} // Also disable if pre-selected
              >
                <MenuItem value="">
                  <em>Seleccione un documento</em>
                </MenuItem>
                {isLoading ? (
                  <MenuItem disabled>Cargando documentos...</MenuItem>
                ) : (
                  documents.map((doc) => (
                    // Ensure backend provides 'id_doc' and 'nombre_doc'
                    <MenuItem key={doc.id_doc} value={doc.id_doc}>
                      {doc.nombre_doc}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Zona de arrastrar y soltar */}
          <Grid item xs={12}>
            <DropZone
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
              isDragActive={isDragActive}
              hasFile={!!file}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              
              {file ? (
                <>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    sx={{ mt: 2 }}
                    disabled={isUploading}
                  >
                    Eliminar
                  </Button>
                </>
              ) : (
                <>
                  <CloudUpload color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    {isDragActive 
                      ? 'Suelte el archivo aquí' 
                      : 'Arrastre un archivo aquí o haga clic para seleccionar'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formatos permitidos: PDF, JPEG, PNG (máx. 5MB)
                  </Typography>
                </>
              )}
            </DropZone>
          </Grid>
          
          {/* Barra de progreso */}
          {isUploading && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {/* Botón de carga */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={isUploading ? <CircularProgress size={24} color="inherit" /> : <CloudUpload />}
              onClick={handleUpload}
              disabled={!selectedDocument || !file || isUploading} // Keep this logic
              sx={{
                py: 1.5,
                backgroundColor: '#B22222',
                '&:hover': {
                  backgroundColor: '#8B0000',
                },
              }}
            >
              {isUploading ? 'Cargando...' : (file ? 'Confirmar Carga' : 'Cargar Documento')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
       {/* Optional: Add a button to go back */}
       <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
         Volver al Dashboard
       </Button>
    </Box>
  );
};

export default DocumentUploader;
