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
  Tooltip,
  useTheme // Import useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  Description // Import Description icon
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../context/DocumentContext'; // Import useDocuments
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
import axios from 'axios';

// Helper function to calculate expiration date (move to a service/utils file ideally)
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

const DocumentUploader = () => {
  const theme = useTheme(); // Get the theme object
  const { user } = useUser();
  // Get documentTypes and refresh function from context
  const { documentTypes, refreshDocuments } = useDocuments();
  const location = useLocation();
  const navigate = useNavigate();

  // Get documentId, documentName, and preselected flag from navigation state
  const { documentId, documentName, preselected } = location.state || {};

  // Initialize state, using documentId from state if available
  const [selectedDocument, setSelectedDocument] = useState(documentId || '');
  const [expeditionDate, setExpeditionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null); // To store info about the selected doc type

  // Set document title based on preselection
  useEffect(() => {
    if (preselected && documentName) {
      document.title = `Cargar: ${documentName}`;
    } else {
      document.title = 'Cargar Documento';
    }
    // Cleanup title on unmount
    return () => { document.title = 'Gestor Documental'; };
  }, [preselected, documentName]);

  // Update documentInfo and reset fields when selectedDocument changes
  useEffect(() => {
    // Ensure documentTypes is loaded and is an array
    if (selectedDocument && Array.isArray(documentTypes)) {
      const doc = documentTypes.find(doc => doc.id_doc === selectedDocument);
      setDocumentInfo(doc || null); // Set to null if not found
      // Reset fields only if it wasn't preselected or if user changes selection manually
      if (!preselected || selectedDocument !== documentId) {
          setExpeditionDate('');
          setExpirationDate('');
          setFile(null);
          setPreviewUrl('');
          setSuccess(false);
          setError('');
      }
    } else {
        setDocumentInfo(null); // Clear info if no document selected or types not loaded
    }
  }, [selectedDocument, documentTypes, preselected, documentId]); // Add dependencies

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
      if (previewUrl && previewUrl.startsWith('blob:')) { // Only revoke blob URLs
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]); // Only depends on file

  // Auto-calculate expiration date
  useEffect(() => {
    if (expeditionDate && documentInfo && documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento) {
      const calculatedDate = calculateExpirationDate(expeditionDate, documentInfo.tiempo_vencimiento);
      setExpirationDate(calculatedDate || '');
    } else {
      // Clear expiration date if conditions are not met (e.g., document doesn't expire)
      // Only clear if it wasn't manually set (though it's disabled now)
       if (documentInfo && documentInfo.vence !== 'si') {
           setExpirationDate('');
       }
    }
  }, [expeditionDate, documentInfo]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (selectedFile && !validTypes.includes(selectedFile.type)) {
      setError('Formato de archivo no válido. Por favor, sube un PDF o una imagen (JPG, PNG).');
      setFile(null);
      setPreviewUrl(''); // Clear preview on error
      return;
    }

    // Validate size (max 5MB)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      setFile(null);
      setPreviewUrl(''); // Clear preview on error
      return;
    }

    setFile(selectedFile);
    setError(''); // Clear error on valid file selection
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // --- Form Validations ---
    if (!selectedDocument) {
      setError('Selecciona un tipo de documento');
      return;
    }

    if (!expeditionDate) {
      setError('La fecha de expedición es requerida');
      return;
    }

    // Check if expiration is needed based on the document type info from context
    if (documentInfo?.vence === 'si' && !expirationDate) {
      // This might happen if calculation failed or expedition date wasn't set first
      setError('La fecha de vencimiento es requerida y no pudo ser calculada. Verifica la fecha de expedición.');
      return;
    }

    if (!file) {
      setError('Selecciona un archivo para cargar');
      return;
    }

    // --- Date Validations ---
    const expeditionDateObj = new Date(expeditionDate);
    // Add time part to avoid timezone issues making today > expeditionDateObj on the same day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of day for comparison

    if (expeditionDateObj > new Date()) { // Compare against current moment for future dates
      setError('La fecha de expedición no puede ser posterior a hoy');
      return;
    }

    if (expirationDate) {
      const expirationDateObj = new Date(expirationDate);
      // Ensure expiration is not before expedition
      if (expirationDateObj < expeditionDateObj) {
        setError('La fecha de vencimiento no puede ser anterior a la fecha de expedición');
        return;
      }
    }

    // --- Prepare data for sending ---
    const formData = new FormData();
    formData.append('userId', user.id);
    // Ensure the key matches backend expectation (e.g., 'documentType' or 'tipoDocId')
    // Based on controller, it might expect 'tipoDocId', but frontend uses 'documentType'.
    // Let's assume the /uploadDocument route handles 'documentType'. If errors occur, check this.
    formData.append('documentType', selectedDocument);
    formData.append('expeditionDate', expeditionDate);
    formData.append('userName', user.name || user.email?.split('@')[0] || 'UnknownUser'); // Add user name/email for folder structure
    formData.append('userEmail', user.email || 'unknown@example.com');

    if (expirationDate && documentInfo?.vence === 'si') { // Only send if it's required and exists
      formData.append('expirationDate', expirationDate);
    }
    formData.append('file', file);
    // Ensure this Parent Folder ID is correct for your Google Drive setup
    formData.append('parentFolderId', '1Q13hKV3vXlsu-Yy0Ix9G9v_IHVFi-rfj');

    // --- Send to server ---
    setLoading(true);

    try {
      // Use environment variable for base URL if possible
      const uploadUrl = `${process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app'}/uploadDocument`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add Authorization header if your backend requires it for uploads
          // 'Authorization': `Bearer ${localStorage.getItem('google_token')}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        await refreshDocuments(); // Refresh context data after successful upload

        // Don't reset form if preselected, user will navigate back
        if (!preselected) {
            setSelectedDocument(''); // Reset selection for next upload
            setExpeditionDate('');
            setExpirationDate('');
            setFile(null);
            setPreviewUrl('');
            setDocumentInfo(null);
        }
      } else {
        setError(response.data.message || 'Ocurrió un error en el servidor.');
      }
    } catch (error) {
      console.error('Error al cargar documento:', error);
      setError(error.response?.data?.message || error.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate back to the dashboard
  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ padding: 3, marginTop: 12 }}>
      <Box display="flex" alignItems="center" mb={2}>
        {/* Add a back button if preselected */}
        {preselected && (
           <IconButton onClick={handleGoBack} sx={{ mr: 1 }} aria-label="Volver al dashboard">
             <ArrowBackIcon />
           </IconButton>
        )}
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 0 }}>
          {/* Display document name in title if preselected */}
          {preselected && documentName
            ? `Cargar: ${documentName}`
            : 'Cargar Documento'}
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Completa la información y selecciona el archivo a subir.
      </Typography>

      <Paper sx={{ padding: 3, marginBottom: 4 }}>
        {success ? (
          // --- Success Message ---
          <Box textAlign="center" py={3}>
            <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ¡Documento cargado exitosamente!
            </Typography>
            <Typography variant="body1" paragraph>
              Tu documento ha sido enviado y está pendiente de revisión.
            </Typography>

            <Box mt={3} display="flex" justifyContent="center" gap={2}>
              {/* Always show "Volver al Dashboard" if preselected */}
              {preselected ? (
                <Button
                  variant="contained"
                  onClick={handleGoBack}
                  sx={{ backgroundColor: '#B22222', '&:hover': { backgroundColor: '#8B0000' } }}
                >
                  Volver al Dashboard
                </Button>
              ) : (
                // Show "Cargar otro" if not preselected
                <Button
                  variant="contained"
                  onClick={() => setSuccess(false)} // Reset success state to show form again
                  sx={{ backgroundColor: '#B22222', '&:hover': { backgroundColor: '#8B0000' } }}
                >
                  Cargar otro documento
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          // --- Upload Form ---
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Document Type Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={preselected}> {/* Disable if preselected */}
                  <InputLabel id="document-type-label">Tipo de Documento</InputLabel>
                  <Select
                    labelId="document-type-label"
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    label="Tipo de Documento"
                  >
                    {/* Populate from documentTypes context */}
                    {Array.isArray(documentTypes) && documentTypes.length > 0 ? (
                      documentTypes.map((doc) => (
                        <MenuItem key={doc.id_doc} value={doc.id_doc}>
                          {doc.nombre_doc}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Cargando tipos...</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Document Info/Hint */}
              {selectedDocument && documentInfo && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {/* Use vence and tiempo_vencimiento from context data */}
                      {documentInfo.vence === 'si' && documentInfo.tiempo_vencimiento
                        ? `Este documento requiere fecha de vencimiento (vigencia: ${documentInfo.tiempo_vencimiento} meses).`
                        : 'Este documento no requiere fecha de vencimiento.'}
                      {/* Add other info if available in docType object */}
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
                  // Add max date validation to prevent future dates directly in input
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                />
              </Grid>

              {/* Expiration Date (Conditional & Disabled) */}
              {selectedDocument && documentInfo?.vence === 'si' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fecha de Vencimiento"
                    type="date"
                    fullWidth
                    value={expirationDate}
                    // onChange={(e) => setExpirationDate(e.target.value)} // Keep disabled
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={true} // Disable as it's auto-calculated
                    helperText="Se calcula automáticamente"
                    // Add min date validation based on expeditionDate
                    inputProps={{ min: expeditionDate || '' }}
                  />
                </Grid>
              )}

              {/* File Input Area */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: `2px dashed ${error && !file ? theme.palette.error.main : '#ccc'}`, // Use theme here
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
                  onDrop={(e) => { // Basic drag and drop
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileChange({ target: { files: e.dataTransfer.files } });
                      }
                  }}
                  onDragOver={(e) => e.preventDefault()} // Necessary for drop
                >
                  <input
                    type="file"
                    id="fileInput"
                    accept=".pdf,.jpg,.jpeg,.png" // Standard image/pdf types
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    // --- File Preview ---
                    <Box>
                      {file?.type === 'application/pdf' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                           <Description sx={{ fontSize: 48, color: theme.palette.error.main, mb: 1 }} /> {/* Use theme here */}
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
                    // --- Placeholder ---
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

              {/* Action Buttons */}
              <Grid item xs={12} display="flex" justifyContent={preselected ? "space-between" : "flex-end"} gap={2}>
                {/* Show Cancel/Back button only if preselected */}
                {preselected && (
                  <Button
                    type="button" // Important: prevent form submission
                    variant="outlined"
                    onClick={handleGoBack}
                    disabled={loading} // Disable while loading
                  >
                    Cancelar
                  </Button>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !file} // Disable if loading or no file selected
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                  sx={{
                    backgroundColor: '#B22222',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#8B0000',
                    },
                    '&.Mui-disabled': { // Style disabled button
                        backgroundColor: 'grey.300',
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