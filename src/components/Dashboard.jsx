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
  ListItemText,
  Card,
  CardContent,
  Grid,
  Avatar,
  LinearProgress
} from '@mui/material';
import { 
  Upload, 
  CheckCircle, 
  Cancel, 
  Visibility, 
  Search, 
  Warning, 
  HourglassEmpty, 
  Block, 
  CloudOff, 
  VaccinesOutlined,
  Dashboard as DashboardIcon,
  Assignment,
  TrendingUp
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useUser } from '../context/UserContext';
import { useDocuments } from '../context/DocumentContext';
import DocumentUploadModal from './student/DocumentUploadModal';
import DoseUploadModal from './student/DoseUploadModal';
import { groupDocumentsByDose, getDoseGroupStatus } from '../utils/documentUtils';
import { Navigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222',
      light: '#E57373',
      dark: '#8B0000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2C3E50',
      light: '#34495E',
      dark: '#1A252F',
    },
    background: {
      default: '#FAFBFC',
      paper: '#FFFFFF',
    },
    success: {
      light: '#E8F5E8',
      main: '#4CAF50',
      dark: '#2E7D32',
    },
    error: {
      light: '#FFEBEE',
      main: '#F44336',
      dark: '#C62828',
    },
    warning: {
      light: '#FFF8E1',
      main: '#FF9800',
      dark: '#F57C00',
    },
    info: {
      light: '#E3F2FD',
      main: '#2196F3',
      dark: '#1565C0',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #F0F0F0',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(178, 34, 34, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#FAFBFC',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: '#2C3E50',
          borderBottom: '2px solid #E0E0E0',
        },
        body: {
          fontSize: '0.875rem',
          padding: '16px',
          borderBottom: '1px solid #F5F5F5',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #F0F0F0',
        },
      },
    },
  },
});

const StatusChip = ({ status }) => {
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

  if (documentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px" sx={{ mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calcular estadísticas del dashboard
  const totalDocuments = filteredDocuments.length;
  const completedDocuments = filteredDocuments.filter(doc => 
    doc.status?.toLowerCase() === 'aprobado' || doc.status?.toLowerCase() === 'cumplido'
  ).length;
  const pendingDocuments = filteredDocuments.filter(doc => 
    doc.status?.toLowerCase() === 'pendiente' || doc.status?.toLowerCase() === 'sin revisar'
  ).length;
  const rejectedDocuments = filteredDocuments.filter(doc => 
    doc.status?.toLowerCase() === 'rechazado'
  ).length;
  
  const completionPercentage = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: theme.palette.background.default,
        pt: 12 
      }}>
        <Container maxWidth="xl">
          <Box sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  mr: 2, 
                  width: 48, 
                  height: 48,
                  background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)'
                }}>
                  <DashboardIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.secondary.main,
                    fontWeight: 700,
                    mb: 0.5
                  }}>
                    Hola, {user.name?.split(' ')[0] || 'Usuario'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                  Por favor cargue o actualice cada documento requerido en la tabla
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Search and Filter Section */}
            <Card sx={{ mb: 4, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ color: theme.palette.secondary.main }}>
                  Mis Documentos de Salud
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                placeholder="Buscar documento por nombre..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.grey[500] }} />
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
            </Card>

            {/* Documents Table */}
            <Paper sx={{ 
              width: '100%', 
              mb: 4,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <TableContainer>
                <Table aria-label="tabla de documentos">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200 }}>Documento</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Acción</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Estado</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Fecha Carga</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Fecha Expedición</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Fecha Vencimiento</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Fecha Revisión</TableCell>
                      <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>Ver</TableCell>
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
                            key={`${doc.id_doc || 'doc'}-${index}`}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: theme.palette.grey[50],
                                transform: 'scale(1.001)',
                                transition: 'all 0.2s ease'
                              },
                              '&:last-child td': { borderBottom: 0 }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                  width: 40, 
                                  height: 40,
                                  backgroundColor: doc.isDoseGroup ? theme.palette.primary.main : theme.palette.grey[200],
                                  color: doc.isDoseGroup ? 'white' : theme.palette.grey[600]
                                }}>
                                  {doc.isDoseGroup ? <VaccinesOutlined /> : <Assignment />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body1" sx={{ 
                                    fontWeight: 600,
                                    color: theme.palette.secondary.main,
                                    mb: 0.5
                                  }}>
                                    {doc.name}
                                  </Typography>
                                  {doc.isDoseGroup && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        label={doc.progress}
                                        size="small"
                                        sx={{
                                          backgroundColor: theme.palette.primary.light,
                                          color: 'white',
                                          fontWeight: 500,
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {doc.doseStatuses?.filter(d => d.status === 'Aprobado' || d.status === 'aprobado' || d.status === 'cumplido').length || 0} aprobadas
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                startIcon={doc.isDoseGroup ? <VaccinesOutlined /> : <Upload />}
                                onClick={() => handleUpload(doc)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  px: 3,
                                  py: 1,
                                  minWidth: '130px',
                                  background: doc.userDocData ? 
                                    'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' :
                                    'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                                  '&:hover': {
                                    background: doc.userDocData ? 
                                      'linear-gradient(135deg, #F57C00 0%, #FF9800 100%)' :
                                      'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 6px 16px rgba(178, 34, 34, 0.4)'
                                  }
                                }}
                              >
                                {doc.isDoseGroup ? 'Gestionar Dosis' : (doc.userDocData ? 'Actualizar' : 'Cargar Documento')}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <StatusChip status={doc.status} />
                            </TableCell>
                            <TableCell>{formatDate(doc.userDocData?.fecha_cargue)}</TableCell>
                            <TableCell>{formatDate(doc.fecha_expedicion)}</TableCell>
                            <TableCell>{doc.vence ? formatDate(doc.fecha_vencimiento) : 'N/A'}</TableCell>
                            <TableCell>{formatDate(doc.userDocData?.fecha_revision)}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {doc.isDoseGroup ? (
                                // Para grupos de dosis, mostrar menú desplegable
                                doc.doseStatuses?.some(d => d.userDoc?.ruta_archivo) ? (
                                  <>
                                    <Tooltip title="Ver dosis cargadas" arrow>
                                      <IconButton
                                        onClick={(e) => handleViewMenuOpen(e, doc)}
                                        sx={{
                                          backgroundColor: theme.palette.primary.light,
                                          color: 'white',
                                          width: 40,
                                          height: 40,
                                          '&:hover': {
                                            backgroundColor: theme.palette.primary.main,
                                            transform: 'scale(1.1)',
                                          }
                                        }}
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
                                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                                    —
                                  </Typography>
                                )
                              ) : (
                                // Para documentos individuales, mostrar enlace directo
                                doc.userDocData?.ruta_archivo ? (
                                  <Tooltip title="Ver documento cargado" arrow>
                                    <IconButton
                                      component="a"
                                      href={doc.userDocData.ruta_archivo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        backgroundColor: theme.palette.info.light,
                                        color: theme.palette.info.main,
                                        width: 40,
                                        height: 40,
                                        '&:hover': {
                                          backgroundColor: theme.palette.info.main,
                                          color: 'white',
                                          transform: 'scale(1.1)',
                                        }
                                      }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                                    —
                                  </Typography>
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
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;