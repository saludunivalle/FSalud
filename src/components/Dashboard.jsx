// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Container,
  TablePagination,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import { Upload, CheckCircle, Cancel, Visibility, Search, Warning, HourglassEmpty, Block, CloudOff } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useUser } from '../context/UserContext';
import { useDocuments } from '../context/DocumentContext';
import DocumentUploadModal from './student/DocumentUploadModal'; // Import the modal component

const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222',
    },
    secondary: {
      main: '#1976d2',
    },
    success: {
      light: '#e8f5e9',
      main: '#4caf50',
    },
    error: {
      light: '#ffebee',
      main: '#f44336',
    },
    warning: {
      light: '#fff3e0',
      main: '#ff9800',
    },
    info: {
      light: '#e3f2fd',
      main: '#2196f3',
    },
    default: {
      light: '#f5f5f5',
      main: '#9e9e9e',
    }
  },
});

const StatusChip = ({ status }) => {
  let icon, color, label;

  switch (status?.toLowerCase()) {
    case 'cumplido':
    case 'aprobado':
      icon = <CheckCircle />;
      color = 'success';
      label = 'Aprobado';
      break;
    case 'rechazado':
      icon = <Cancel />;
      color = 'error';
      label = 'Rechazado';
      break;
    case 'expirado':
    case 'vencido':
      icon = <Warning />;
      color = 'warning';
      label = 'Vencido';
      break;
    case 'sin revisar':
    case 'pendiente':
      icon = <HourglassEmpty />;
      color = 'info';
      label = 'Pendiente';
      break;
    case 'no aplica':
      icon = <Block />;
      color = 'default';
      label = 'No Aplica';
      break;
    case 'sin cargar':
    default:
      icon = <CloudOff />;
      color = 'default';
      label = 'Sin Cargar';
      break;
  }

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{ minWidth: '110px' }}
    />
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const { documentTypes, userDocuments, loading: documentsLoading, getDocumentStatus, isDocumentExpired } = useDocuments();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedDocuments, setCombinedDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  // State for controlling the upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocumentName, setSelectedDocumentName] = useState('');

  useEffect(() => {
    if (Array.isArray(documentTypes) && documentTypes.length > 0) {
      const combined = documentTypes.map(docType => {
        const userDoc = Array.isArray(userDocuments)
          ? userDocuments.find(ud => ud.id_doc === docType.id_tipoDoc) // Match userDoc using id_tipoDoc
          : null;

        const status = getDocumentStatus(userDoc, docType);

        return {
          id_doc: docType.id_tipoDoc, // Use id_tipoDoc from the document type definition
          name: docType.nombre_doc || docType.nombre_tipoDoc || `Documento ID: ${docType.id_tipoDoc}`, // Also use id_tipoDoc here for consistency if name is missing
          vence: docType.vence === 'si',
          tiempo_vencimiento: docType.tiempo_vencimiento,
          userDocData: userDoc || null,
          status: status,
          fecha_expedicion: userDoc?.fecha_expedicion || null,
          fecha_vencimiento: userDoc?.fecha_vencimiento || null,
        };
      });
      setCombinedDocuments(combined);
    } else {
      setCombinedDocuments([]);
    }
  }, [documentTypes, userDocuments, getDocumentStatus]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredDocuments(combinedDocuments);
    } else {
      const filtered = combinedDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
    setPage(0);
  }, [searchTerm, combinedDocuments]);

  const formatDate = (date) => {
    if (!date) return '—';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to open the upload modal with a selected document
  const handleUpload = (documentTypeId, documentName) => { // Parameter name is documentTypeId
    setSelectedDocumentId(documentTypeId); // Set the correct ID
    setSelectedDocumentName(documentName);
    setUploadModalOpen(true);
  };

  // Function to close the upload modal
  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
  };

  const getRowBackground = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return theme.palette.success.light;
      case 'rechazado':
        return theme.palette.error.light;
      case 'vencido':
        return theme.palette.warning.light;
      case 'pendiente':
        return theme.palette.info.light;
      case 'no aplica':
        return theme.palette.grey[100];
      case 'sin cargar':
        return 'inherit';
      default:
        return 'inherit';
    }
  };

  if (documentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px" sx={{ mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl">
        <Box sx={{ padding: 3, marginTop: 12 }}>
          <Typography variant="h5" gutterBottom>
            Bienvenido, {user?.name || 'Usuario'}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Por favor cargue o actualice cada documento requerido en la tabla.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar documento por nombre..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} edge="end">
                      <Cancel />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
            <TableContainer sx={{ maxHeight: 540 }}>
              <Table stickyHeader aria-label="tabla de documentos">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 180 }}>Documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 150 }}>Cargue los documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 130 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha cargue</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha de expedición</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha de vencimiento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha Revisión</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 80 }}>Ver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow key="no-documents-row">
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          {combinedDocuments.length === 0 ? "No hay tipos de documentos definidos." : "No se encontraron documentos con ese nombre."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doc) => (
                        <TableRow
                          hover
                          key={doc.id_doc} // Use the unique ID from the mapping (which is now id_tipoDoc)
                          sx={{ backgroundColor: getRowBackground(doc.status) }}
                        >
                          <TableCell>{doc.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<Upload />}
                              size="small"
                              onClick={() => handleUpload(doc.id_doc, doc.name)} // Pass the correct ID (which is id_tipoDoc)
                              sx={{
                                minWidth: '120px',
                                px: 1.5,
                                py: 0.7
                              }}
                            >
                              {doc.userDocData ? 'Actualizar' : 'Cargar'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <StatusChip status={doc.status} />
                          </TableCell>
                          <TableCell>{formatDate(doc.userDocData?.fecha_cargue)}</TableCell>
                          <TableCell>{formatDate(doc.fecha_expedicion)}</TableCell>
                          <TableCell>{doc.vence ? formatDate(doc.fecha_vencimiento) : 'N/A'}</TableCell>
                          <TableCell>{formatDate(doc.userDocData?.fecha_revision)}</TableCell>
                          <TableCell>
                            {doc.userDocData?.ruta_archivo ? (
                              <Tooltip title="Ver documento cargado">
                                <IconButton
                                  color="primary"
                                  component="a"
                                  href={doc.userDocData.ruta_archivo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredDocuments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Paper>

          {/* Render the Document Upload Modal */}
          <DocumentUploadModal
            open={uploadModalOpen}
            onClose={handleCloseUploadModal}
            selectedDocumentId={selectedDocumentId}
            documentName={selectedDocumentName}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;