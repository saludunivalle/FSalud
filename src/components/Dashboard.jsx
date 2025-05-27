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
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Upload, CheckCircle, Cancel, Visibility, Search, Warning, HourglassEmpty, Block, CloudOff, VaccinesOutlined, ExpandMore } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useUser } from '../context/UserContext';
import { useDocuments } from '../context/DocumentContext';
import DocumentUploadModal from './student/DocumentUploadModal'; // Import the modal component
import DoseUploadModal from './student/DoseUploadModal'; // Import the dose modal component
import { groupDocumentsByDose, getDoseGroupStatus } from '../utils/documentUtils';
import { Navigate } from 'react-router-dom'; // Added Navigate

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

  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedDocuments, setCombinedDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  // State for controlling the upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocumentName, setSelectedDocumentName] = useState('');
  
  // State for controlling the dose upload modal
  const [doseModalOpen, setDoseModalOpen] = useState(false);
  const [selectedDoseGroup, setSelectedDoseGroup] = useState(null);

  // State for controlling the view menu
  const [viewMenuAnchor, setViewMenuAnchor] = useState(null);
  const [selectedDocForView, setSelectedDocForView] = useState(null);

  useEffect(() => {
    if (userData) {
      console.log("User data updated:", userData);
    }
  }, [userData]);

  useEffect(() => {
    if (Array.isArray(documentTypes) && documentTypes.length > 0) {
      // Primero agrupar documentos por dosis
      const groupedDocuments = groupDocumentsByDose(documentTypes);
      
      const combined = groupedDocuments.map(docGroup => {
        if (docGroup.isDoseGroup) {
          // Es un grupo de dosis
          const doseStatus = getDoseGroupStatus(docGroup, userDocuments, getDocumentStatus);
          return {
            id_doc: docGroup.id_doc,
            name: docGroup.name,
            isDoseGroup: true,
            doseGroup: docGroup,
            status: doseStatus.consolidatedStatus,
            progress: doseStatus.progress,
            doseStatuses: doseStatus.doseStatuses,
            // Para compatibilidad con la tabla
            vence: docGroup.baseDoc.vence === 'si',
            tiempo_vencimiento: docGroup.baseDoc.tiempo_vencimiento,
            // Usar las fechas más recientes del grupo de dosis
            userDocData: doseStatus.latestUploadDate ? {
              fecha_cargue: doseStatus.latestUploadDate,
              fecha_revision: doseStatus.latestReviewDate
            } : null,
            fecha_expedicion: doseStatus.latestExpeditionDate,
            fecha_vencimiento: doseStatus.latestExpirationDate,
          };
        } else {
          // Es un documento individual
          const userDoc = Array.isArray(userDocuments)
            ? userDocuments.find(ud => ud.id_doc === docGroup.id_doc)
            : null;
          const status = getDocumentStatus(userDoc, docGroup);
          return {
            id_doc: docGroup.id_doc,
            name: docGroup.nombre_doc || `Documento ID: ${docGroup.id_doc}`,
            isDoseGroup: false,
            vence: docGroup.vence === 'si',
            tiempo_vencimiento: docGroup.tiempo_vencimiento,
            userDocData: userDoc || null,
            status: status,
            fecha_expedicion: userDoc?.fecha_expedicion || null,
            fecha_vencimiento: userDoc?.fecha_vencimiento || null,
          };
        }
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
  }, [searchTerm, combinedDocuments]);

  // Safeguard check for user, though ProtectedRoute and Page component should handle this.
  if (!user) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center', marginTop: 12 }}>
        <Typography variant="h5" color="error" gutterBottom>
          No autorizado
        </Typography>
        <Typography>
          Debes iniciar sesión para acceder a esta página.
        </Typography>
      </Box>
    );
  }

  if (user.isFirstLogin === true && user.role === 'estudiante') {
    return <Navigate to="/complete-profile" replace />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—';

    let dateObj;
    // Check if the dateString is likely in "DD/MM/YYYY" format
    const parts = typeof dateString === 'string' ? dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) : null;

    if (parts) {
      // parts[1] is day, parts[2] is month, parts[3] is year
      // JavaScript's Date month is 0-indexed, so subtract 1 from month
      // This creates a date at LOCAL midnight, which is what we want.
      dateObj = new Date(parseInt(parts[3], 10), parseInt(parts[2], 10) - 1, parseInt(parts[1], 10));
    } else {
      // Fallback for other formats (e.g., if some old data is still YYYY-MM-DD)
      // This might still cause the one-day-off issue if dateString is "YYYY-MM-DD"
      // because it's parsed as UTC.
      const isoParts = typeof dateString === 'string' ? dateString.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
      if (isoParts) {
        // If it's "YYYY-MM-DD", explicitly treat it as local to avoid UTC conversion issues for display.
        dateObj = new Date(parseInt(isoParts[1], 10), parseInt(isoParts[2], 10) - 1, parseInt(isoParts[3], 10));
      } else {
        dateObj = new Date(dateString); // General fallback
      }
    }

    if (isNaN(dateObj.getTime())) {
      // console.warn(`Could not parse date: ${dateString}`);
      return dateString || '—'; 
    }

    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Function to open the upload modal with a selected document
  const handleUpload = (doc) => {
    if (doc.isDoseGroup) {
      // Abrir modal de dosis - pasar el documento base del grupo
      setSelectedDoseGroup(doc.doseGroup.baseDoc);
      setDoseModalOpen(true);
    } else {
      // Abrir modal normal
      setSelectedDocumentId(doc.id_doc);
      setSelectedDocumentName(doc.name);
      setUploadModalOpen(true);
    }
  };

  // Function to close the upload modal
  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
  };

  // Function to close the dose modal
  const handleCloseDoseModal = () => {
    setDoseModalOpen(false);
    setSelectedDoseGroup(null);
  };

  // Functions to handle view menu
  const handleViewMenuOpen = (event, doc) => {
    setViewMenuAnchor(event.currentTarget);
    setSelectedDocForView(doc);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchor(null);
    setSelectedDocForView(null);
  };

  const handleViewDose = (doseInfo) => {
    if (doseInfo.userDoc?.ruta_archivo) {
      window.open(doseInfo.userDoc.ruta_archivo, '_blank', 'noopener,noreferrer');
    }
    handleViewMenuClose();
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
            Bienvenido, {user.name || 'Usuario'} {/* user is guaranteed to be non-null here */}
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
                      .map((doc, index) => (
                        <TableRow
                          hover
                          key={`${doc.id_doc || 'doc'}-${index}`} // Use unique key with fallback
                          sx={{ backgroundColor: getRowBackground(doc.status) }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {doc.isDoseGroup && <VaccinesOutlined color="primary" fontSize="small" />}
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {doc.name}
                                </Typography>
                                {doc.isDoseGroup && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip
                                      label={doc.progress}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      ({doc.doseStatuses?.filter(d => d.status === 'Aprobado' || d.status === 'aprobado' || d.status === 'cumplido').length || 0} aprobadas)
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={doc.isDoseGroup ? <VaccinesOutlined /> : <Upload />}
                              size="small"
                              onClick={() => handleUpload(doc)}
                              sx={{
                                minWidth: '120px',
                                px: 1.5,
                                py: 0.7
                              }}
                            >
                              {doc.isDoseGroup ? 'Dosis' : (doc.userDocData ? 'Actualizar' : 'Cargar')}
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
                            {doc.isDoseGroup ? (
                              // Para grupos de dosis, mostrar menú desplegable
                              doc.doseStatuses?.some(d => d.userDoc?.ruta_archivo) ? (
                                <>
                                  <Tooltip title="Ver dosis cargadas">
                                    <IconButton
                                      color="primary"
                                      onClick={(e) => handleViewMenuOpen(e, doc)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Menu
                                    anchorEl={viewMenuAnchor}
                                    open={Boolean(viewMenuAnchor) && selectedDocForView?.id_doc === doc.id_doc}
                                    onClose={handleViewMenuClose}
                                    PaperProps={{
                                      sx: { minWidth: 200 }
                                    }}
                                  >
                                    {doc.doseStatuses
                                      ?.filter(d => d.userDoc?.ruta_archivo)
                                      ?.map((doseInfo, index) => (
                                        <MenuItem 
                                          key={`dose-view-${doseInfo.doseNumber}-${index}`}
                                          onClick={() => handleViewDose(doseInfo)}
                                        >
                                          <ListItemIcon>
                                            <Visibility fontSize="small" />
                                          </ListItemIcon>
                                          <ListItemText 
                                            primary={
                                              doc.doseGroup?.baseDoc?.nombre_doc?.toLowerCase().includes('covid') 
                                                ? doseInfo.doseNumber 
                                                : `Dosis ${doseInfo.doseNumber}`
                                            }
                                            secondary={
                                              doseInfo.status === 'Aprobado' || doseInfo.status === 'aprobado' || doseInfo.status === 'cumplido' ? 'Aprobada' :
                                              doseInfo.status === 'Pendiente' || doseInfo.status === 'pendiente' || doseInfo.status === 'sin revisar' ? 'En revisión' :
                                              doseInfo.status === 'Rechazado' || doseInfo.status === 'rechazado' ? 'Rechazada' : doseInfo.status
                                            }
                                          />
                                        </MenuItem>
                                      ))}
                                  </Menu>
                                </>
                              ) : (
                                '—'
                              )
                            ) : (
                              // Para documentos individuales, mostrar enlace directo
                              doc.userDocData?.ruta_archivo ? (
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
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Render the Document Upload Modal */}
          <DocumentUploadModal
            open={uploadModalOpen}
            onClose={handleCloseUploadModal}
            selectedDocumentId={selectedDocumentId}
            documentName={selectedDocumentName}
          />

          {/* Render the Dose Upload Modal */}
          <DoseUploadModal
            open={doseModalOpen}
            onClose={handleCloseDoseModal}
            document={selectedDoseGroup}
            documentName={selectedDoseGroup?.nombre_doc || ''}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;