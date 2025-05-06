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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
    // Add months correctly
    expeditionDate.setMonth(expeditionDate.getMonth() + parseInt(months, 10));
    // Format as YYYY-MM-DD for the input field
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

  // State for form data
  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);

  // Reset and set state when modal opens with a preselected document
  useEffect(() => {
    if (open) {
      setExpeditionDate('');
      setExpirationDate('');
      setFile(null);
      setPreviewUrl('');
      setSuccess(false);
      setError('');
      setLoading(false); // Ensure loading is reset
      // Find and set document info based on the incoming ID
      if (selectedDocumentId && Array.isArray(documentTypes)) {
        const doc = documentTypes.find(doc => doc.id_doc === selectedDocumentId);
        setDocumentInfo(doc || null);
      } else {
        setDocumentInfo(null);
      }
    }
  }, [open, selectedDocumentId, documentTypes]); // Depend on open and selectedDocumentId

  // Create file preview
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

    // Cleanup object URL
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]); // Only depends on file

  // Auto-calculate expiration date
  useEffect(() => {
    if (expeditionDate && documentInfo && documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento) {
      const calculatedDate = calculateExpirationDate(expeditionDate, documentInfo.tiempo_vencimiento);
      setExpirationDate(calculatedDate || '');
    } else if (documentInfo && documentInfo.vence !== 'si') {
      setExpirationDate('');
    }
  }, [expeditionDate, documentInfo]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (selectedFile && !validTypes.includes(selectedFile.type)) {
      setError('Formato de archivo no válido. Por favor, sube un PDF o una imagen (JPG, PNG).');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    // Validate size (max 5MB)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    setFile(selectedFile);
    setError(''); // Clear error on valid file selection
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Form Validations


    if (!expeditionDate) {
      setError('La fecha de expedición es requerida');
      return;
    }

    if (documentInfo?.vence === 'si' && !expirationDate) {
      setError('La fecha de vencimiento es requerida y no pudo ser calculada. Verifica la fecha de expedición.');
      return;
    }

    if (!file) {
      setError('Selecciona un archivo para cargar');
      return;
    }

    // Date Validations
    const expeditionDateObj = new Date(expeditionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expeditionDateObj > new Date()) { // Compare against current moment
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

    // Prepare data for sending
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('documentType', selectedDocumentId); // Use selectedDocumentId from props
    formData.append('expeditionDate', expeditionDate);
    formData.append('userName', user.name || user.email?.split('@')[0] || 'UnknownUser');
    formData.append('userEmail', user.email || 'unknown@example.com');

    if (expirationDate && documentInfo?.vence === 'si') {
      formData.append('expirationDate', expirationDate);
    }
    formData.append('file', file);
    formData.append('parentFolderId', '1Q13hKV3vXlsu-Yy0Ix9G9v_IHVFi-rfj'); // Ensure this is correct

    // Send to server
    setLoading(true);

    try {
      // Use environment variable or default URL - CORRECT THE ENDPOINT
      const uploadUrl = `${process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app'}/api/documentos/subir`; 

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add Authorization if needed by your backend
          // 'Authorization': `Bearer ${localStorage.getItem('google_token')}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        await refreshDocuments(); // Refresh context data after successful upload
      } else {
        setError(response.data.message || 'Ocurrió un error en el servidor.');
      }
    } catch (error) {
      console.error('Error al cargar documento:', error);
      // Try to get more specific error message from backend response
      const backendError = error.response?.data?.details || error.response?.data?.error || error.response?.data?.message;
      setError(backendError || error.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Use the onClose prop passed from Dashboard to close the modal
  const handleClose = () => {
    if (!loading) { // Prevent closing while loading
      onClose();
    }
  };

  const handleUploadAnother = () => {
    // Reset form for another upload, allowing selection
    setExpeditionDate('');
    setExpirationDate('');
    setFile(null);
    setPreviewUrl('');
    setSuccess(false);
    setError('');
    setDocumentInfo(null); // Clear doc info as well
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="document-upload-title"
    >
      <DialogTitle id="document-upload-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {documentName ? `Cargar / Actualizar: ${documentName}` : 'Cargar Documento'}
        <IconButton onClick={handleClose} aria-label="cerrar" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
          // Success Message
          <Box textAlign="center" py={3}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ¡Documento cargado exitosamente!
            </Typography>
            <Typography variant="body1" paragraph>
              Tu documento ha sido enviado y está pendiente de revisión.
            </Typography>

            <Box mt={3} display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                onClick={handleClose} // Close modal on "Volver"
                sx={{ backgroundColor: '#B22222', '&:hover': { backgroundColor: '#8B0000' } }}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        ) : (
          // Upload Form
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Document Info/Hint */}
              {selectedDocumentId && documentInfo && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento
                        ? `Este documento requiere fecha de vencimiento (vigencia: ${documentInfo.tiempo_vencimiento} meses).`
                        : 'Este documento no requiere fecha de vencimiento.'}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Expedition Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Expedición"
                  type="date"
                  fullWidth
                  value={expeditionDate}
                  onChange={(e) => setExpeditionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{ max: new Date().toISOString().split("T")[0] }} // Prevent future dates
                />
              </Grid>

              {/* Expiration Date (Conditional & Disabled) */}
              {selectedDocumentId && documentInfo?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={true} // Always disabled as it's calculated
                    helperText="Se calcula automáticamente"
                    inputProps={{ min: expeditionDate || '' }} // Prevent expiration before expedition
                  />
                </Grid>
              )}

              {/* File Input Area */}
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
                  // Use label's htmlFor to trigger input click for accessibility
                  onClick={() => document.getElementById('fileInputModal').click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    type="file"
                    id="fileInputModal" // Unique ID for the modal input
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    // File Preview
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
                    // Placeholder
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
            {/* Submit button moved to DialogActions */}
          </Box>
        )}
      </DialogContent>

      {/* Actions only shown when not in success state */}
      {!success && (
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            // Use type="button" to prevent accidental form submission if nested
            type="button"
            onClick={handleSubmit} // Trigger submit logic
            variant="contained"
            disabled={loading || !file} // Disable if loading or no file
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