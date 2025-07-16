// src/components/admin/StudentDocumentManager.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Warning,
  HourglassEmpty,
  Block,
  CloudOff,
  Visibility,
  Edit,
  Person,
  WhatsApp,
  Search,
  Refresh,
  ExpandMore,
  VaccinesOutlined,
  CloudUpload
} from '@mui/icons-material';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import DocumentReviewModal from './DocumentReviewModal';
import AdminDocumentUploadModal from './AdminDocumentUploadModal';
import { getUserById, getUserDocumentsWithDetails, getRequiredDocumentTypes, transformUserForManager, clearCache } from '../../services/userService';
import { getUserProfile, transformUserProfileForComponents, clearUserProfileCache } from '../../services/userProfileService';
import { groupDocumentsByDose, getDoseGroupStatus } from '../../utils/documentUtils';
import { useSaturation } from '../../context/SaturationContext';
import { Autorenew } from '@mui/icons-material';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222', // Color rojo sangre toro (Universidad del Valle)
      light: alpha('#B22222', 0.15), // Versión muy suave del color primario
    },
    secondary: {
      main: '#1976d2',
      light: alpha('#1976d2', 0.15),
    },
    success: {
      main: '#4caf50',
      light: alpha('#4caf50', 0.15), // Color verde muy suave
    },
    warning: {
      main: '#ff9800',
      light: alpha('#ff9800', 0.15), // Color naranja muy suave
    },
    error: {
      main: '#f44336',
      light: alpha('#f44336', 0.15), // Color rojo muy suave
    },
    info: {
      main: '#2196f3',
      light: alpha('#2196f3', 0.15), // Color azul muy suave
    },
    default: {
      light: '#f5f5f5',
      main: '#9e9e9e',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        outlined: {
          borderWidth: 1.5,
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    }
  }
});

// Componente para el indicador de estado
const StatusChip = ({ status }) => {
  let icon, color, label;

  switch (status?.toLowerCase()) {
    case 'aprobado':
      icon = <CheckCircle fontSize="small" />;
      color = 'success';
      label = 'Aprobado';
      break;
    case 'rechazado':
      icon = <Cancel fontSize="small" />;
      color = 'error';
      label = 'Rechazado';
      break;
    case 'vencido':
      icon = <Warning fontSize="small" />;
      color = 'warning';
      label = 'Vencido';
      break;
    case 'pendiente':
      icon = <HourglassEmpty fontSize="small" />;
      color = 'info';
      label = 'Pendiente';
      break;
    case 'sin cargar':
      icon = <CloudOff fontSize="small" />;
      color = 'default';
      label = 'Sin Cargar';
      break;
    default:
      icon = <CloudOff fontSize="small" />;
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
      sx={{ minWidth: '100px', fontSize: '0.75rem' }}
    />
  );
};

const StudentDocumentManager = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [documentStats, setDocumentStats] = useState({
    aprobados: 0,
    pendientes: 0,
    rechazados: 0,
    vencidos: 0,
    sinCargar: 0
  });
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  const { modoSaturado, setModoSaturado } = useSaturation();

  // Cargar datos del estudiante
  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Cargando datos del estudiante: ${studentId}`);
        
        // Usar el nuevo endpoint consolidado
        const userProfileResponse = await getUserProfile(studentId);
        
        console.log('Respuesta del perfil consolidado:', userProfileResponse);
        
        if (!userProfileResponse.data || !userProfileResponse.data.user) {
          throw new Error('Usuario no encontrado');
        }
        
        // Transformar datos al formato esperado por el componente
        const transformedStudent = transformUserProfileForComponents(userProfileResponse);
        
        // Procesar grupos de dosis y calcular estado consolidado
        const processedDocuments = transformedStudent.documentos.map(doc => {
          if (doc.isDoseGroup) {
            // Función mejorada para obtener estado de documento individual
            const getDocumentStatus = (userDoc, docType) => {
              // Si no hay documento cargado
              if (!userDoc) {
                return 'sin cargar';
              }
              
              // Si existe el documento y tiene archivo o fecha de carga, está cargado
              const hasFile = userDoc.ruta_archivo && userDoc.ruta_archivo.trim() !== '';
              const hasUploadDate = userDoc.fecha_cargue && userDoc.fecha_cargue.trim() !== '';
              
              // Si no tiene archivo ni fecha de carga, considerar sin cargar
              if (!hasFile && !hasUploadDate) {
                return 'sin cargar';
              }
              
              // Devolver el estado que tiene asignado
              if (!userDoc.estado || userDoc.estado.trim() === '') {
                return 'pendiente';
              }
              
              // Normalizar el estado a los valores estándar
              const estadoOriginal = userDoc.estado.toLowerCase().trim();
              switch (estadoOriginal) {
                case 'aprobado':
                case 'cumplido':
                  return 'aprobado';
                case 'rechazado':
                  return 'rechazado';
                case 'vencido':
                case 'expirado':
                  return 'vencido';
                case 'pendiente':
                case 'sin revisar':
                  return 'pendiente';
                case 'sin cargar':
                  return 'sin cargar';
                default:
                  console.warn(`Estado no reconocido: ${estadoOriginal}, usando 'pendiente' como fallback`);
                  return 'pendiente';
              }
            };
            
            // Obtener estado consolidado del grupo de dosis
            const doseGroupStatus = getDoseGroupStatus(
              { 
                baseDoc: doc.baseDoc, 
                totalDoses: doc.totalDoses 
              }, 
              doc.userDocs, 
              getDocumentStatus
            );
            
            return {
              ...doc,
              estado: doseGroupStatus.consolidatedStatus,
              doseStatuses: doseGroupStatus.doseStatuses,
              progress: doseGroupStatus.progress,
              completedDoses: doseGroupStatus.completedDoses,
              uploadedDoses: doseGroupStatus.uploadedDoses,
              fechaCargue: doseGroupStatus.latestUploadDate,
              fechaExpedicion: doseGroupStatus.latestExpeditionDate,
              fechaVencimiento: doseGroupStatus.latestExpirationDate,
              fechaRevision: doseGroupStatus.latestReviewDate
            };
          } else {
            // Para documentos normales - usar el estado ya procesado por transformUserForManager
            // Retornar el documento tal como viene de transformUserForManager
            return doc;
          }
        });
        
        console.log('Estudiante transformado:', { ...transformedStudent, documentos: processedDocuments });
        setStudent({ ...transformedStudent, documentos: processedDocuments });
        
        // Calcular estadísticas de documentos (considerando dosis individuales)
        const stats = {
          aprobados: 0,
          pendientes: 0,
          rechazados: 0,
          vencidos: 0,
          sinCargar: 0
        };
        
        processedDocuments.forEach(doc => {
          if (doc.isDoseGroup) {
            // Para grupos de dosis, contar cada dosis individual
            doc.doseStatuses?.forEach(doseStatus => {
              switch (doseStatus.status?.toLowerCase()) {
                case 'aprobado':
                  stats.aprobados++;
                  break;
                case 'pendiente':
                  stats.pendientes++;
                  break;
                case 'rechazado':
                  stats.rechazados++;
                  break;
                case 'vencido':
                  stats.vencidos++;
                  break;
                case 'sin cargar':
                default:
                  stats.sinCargar++;
                  break;
              }
            });
          } else {
            // Para documentos normales
            switch (doc.estado?.toLowerCase()) {
              case 'aprobado':
                stats.aprobados++;
                break;
              case 'pendiente':
                stats.pendientes++;
                break;
              case 'rechazado':
                stats.rechazados++;
                break;
              case 'vencido':
                stats.vencidos++;
                break;
              case 'sin cargar':
              default:
                stats.sinCargar++;
                break;
            }
          }
        });
        
        setDocumentStats(stats);
        
      } catch (error) {
        console.error('Error cargando datos del estudiante:', error);
        
        // Manejo específico para errores de rate limiting
        if (error.response?.status === 429 || 
            (error.response?.status === 500 && error.message?.includes('Quota exceeded'))) {
          setModoSaturado(true);
          setError('El sistema está experimentando una alta demanda. Los datos se cargarán automáticamente en unos segundos...');
          
          // Reintentar después de 10 segundos con mensaje específico
          setTimeout(() => {
            console.log('Reintentando carga automática después de rate limit...');
            loadStudentData();
          }, 10000);
        } else if (error.message && error.message.includes('no encontrado')) {
          setError(error.message || 'Usuario no encontrado');
          // Si es un error 404, redirigir al dashboard después de un momento
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 3000);
        } else {
          setError(error.message || 'Error al cargar los datos del estudiante');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, navigate, setModoSaturado]);

  // Función para recargar datos
  const handleReload = () => {
    const loadStudentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Limpiar cache específico del usuario antes de recargar
        clearCache(`user-${studentId}`);
        clearCache(`user-docs-${studentId}`);
        clearUserProfileCache(`user-profile-${studentId}`);
        
        // Usar el nuevo endpoint consolidado
        const userProfileResponse = await getUserProfile(studentId);
        
        console.log('Respuesta del perfil consolidado (reload):', userProfileResponse);
        
        if (!userProfileResponse.data || !userProfileResponse.data.user) {
          throw new Error('Usuario no encontrado');
        }
        
        // Transformar datos al formato esperado por el componente
        const transformedStudent = transformUserProfileForComponents(userProfileResponse);
        
        // Procesar grupos de dosis y calcular estado consolidado
        const processedDocuments = transformedStudent.documentos.map(doc => {
          if (doc.isDoseGroup) {
            // Función mejorada para obtener estado de documento individual
            const getDocumentStatus = (userDoc, docType) => {
              // Si no hay documento cargado
              if (!userDoc) {
                return 'sin cargar';
              }
              
              // Si existe el documento y tiene archivo o fecha de carga, está cargado
              const hasFile = userDoc.ruta_archivo && userDoc.ruta_archivo.trim() !== '';
              const hasUploadDate = userDoc.fecha_cargue && userDoc.fecha_cargue.trim() !== '';
              
              // Si no tiene archivo ni fecha de carga, considerar sin cargar
              if (!hasFile && !hasUploadDate) {
                return 'sin cargar';
              }
              
              // Devolver el estado que tiene asignado
              if (!userDoc.estado || userDoc.estado.trim() === '') {
                return 'pendiente';
              }
              
              // Normalizar el estado a los valores estándar
              const estadoOriginal = userDoc.estado.toLowerCase().trim();
              switch (estadoOriginal) {
                case 'aprobado':
                case 'cumplido':
                  return 'aprobado';
                case 'rechazado':
                  return 'rechazado';
                case 'vencido':
                case 'expirado':
                  return 'vencido';
                case 'pendiente':
                case 'sin revisar':
                  return 'pendiente';
                case 'sin cargar':
                  return 'sin cargar';
                default:
                  console.warn(`Estado no reconocido: ${estadoOriginal}, usando 'pendiente' como fallback`);
                  return 'pendiente';
              }
            };
            
            // Obtener estado consolidado del grupo de dosis
            const doseGroupStatus = getDoseGroupStatus(
              { 
                baseDoc: doc.baseDoc, 
                totalDoses: doc.totalDoses 
              }, 
              doc.userDocs, 
              getDocumentStatus
            );
            
            return {
              ...doc,
              estado: doseGroupStatus.consolidatedStatus,
              doseStatuses: doseGroupStatus.doseStatuses,
              progress: doseGroupStatus.progress,
              completedDoses: doseGroupStatus.completedDoses,
              uploadedDoses: doseGroupStatus.uploadedDoses,
              fechaCargue: doseGroupStatus.latestUploadDate,
              fechaExpedicion: doseGroupStatus.latestExpeditionDate,
              fechaVencimiento: doseGroupStatus.latestExpirationDate,
              fechaRevision: doseGroupStatus.latestReviewDate
            };
          } else {
            // Para documentos normales - usar el estado ya procesado por transformUserForManager
            // Retornar el documento tal como viene de transformUserForManager
            return doc;
          }
        });
        
        setStudent({ ...transformedStudent, documentos: processedDocuments });
        
        // Recalcular estadísticas (considerando dosis individuales)
        const stats = {
          aprobados: 0,
          pendientes: 0,
          rechazados: 0,
          vencidos: 0,
          sinCargar: 0
        };
        
        processedDocuments.forEach(doc => {
          if (doc.isDoseGroup) {
            // Para grupos de dosis, contar cada dosis individual
            doc.doseStatuses?.forEach(doseStatus => {
              switch (doseStatus.status?.toLowerCase()) {
                case 'aprobado':
                  stats.aprobados++;
                  break;
                case 'pendiente':
                  stats.pendientes++;
                  break;
                case 'rechazado':
                  stats.rechazados++;
                  break;
                case 'vencido':
                  stats.vencidos++;
                  break;
                case 'sin cargar':
                default:
                  stats.sinCargar++;
                  break;
              }
            });
          } else {
            // Para documentos normales
            switch (doc.estado?.toLowerCase()) {
              case 'aprobado':
                stats.aprobados++;
                break;
              case 'pendiente':
                stats.pendientes++;
                break;
              case 'rechazado':
                stats.rechazados++;
                break;
              case 'vencido':
                stats.vencidos++;
                break;
              case 'sin cargar':
              default:
                stats.sinCargar++;
                break;
            }
          }
        });
        
        setDocumentStats(stats);
        
      } catch (error) {
        console.error('Error recargando datos:', error);
        
        // Manejo específico para errores de rate limiting en reload
        if (error.response?.status === 429 || 
            (error.response?.status === 500 && error.message?.includes('Quota exceeded'))) {
          setModoSaturado(true);
          setError('Sistema con alta demanda, reintentando automáticamente...');
          
          // Reintentar después de 8 segundos
          setTimeout(() => {
            console.log('Reintentando reload automático después de rate limit...');
            handleReload();
          }, 8000);
        } else {
          setError(error.message || 'Error al recargar los datos');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStudentData();
  };

  // Efecto para filtrar documentos
  useEffect(() => {
    if (!student?.documentos) {
      setFilteredDocuments([]);
      return;
    }

    let filtered = student.documentos;

    // Filtrar por estado de documentación
    if (statusFilter === 'Aprobados') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'aprobado');
    } else if (statusFilter === 'Pendientes') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'pendiente');
    } else if (statusFilter === 'Rechazados') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'rechazado');
    } else if (statusFilter === 'Vencidos') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'vencido');
    } else if (statusFilter === 'Sin cargar') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'sin cargar' || !doc.estado);
    }

    // Filtrar por término de búsqueda
    if (searchTerm !== '') {
      filtered = filtered.filter(doc => 
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.comentarios && doc.comentarios.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDocuments(filtered);
  }, [student, statusFilter, searchTerm]);

  const handleOpenModal = (document) => {
    setSelectedDocument(document);
  };

  const handleCloseModal = (updatedDoc = null) => {
    if (updatedDoc) {
      // Limpiar cache específico antes de recargar datos
      console.log('Documento actualizado, limpiando cache y recargando datos...');
      clearCache(`user-${studentId}`);
      clearCache(`user-docs-${studentId}`);
      clearUserProfileCache(`user-profile-${studentId}`);
      handleReload();
    }
    
    setSelectedDocument(null);
  };

  const handleOpenUploadModal = (document) => {
    console.log('DEBUG - Opening upload modal with:', { document, student });
    
    // Validar que tengamos la información necesaria
    if (!student || (!student.id && !student.id_usuario)) {
      console.error('Error: Información del estudiante incompleta:', student);
      setError('Error: No se pudo obtener la información del estudiante');
      return;
    }
    
    if (!document || !document.id) {
      console.error('Error: Información del documento incompleta:', document);
      setError('Error: No se pudo obtener la información del documento');
      return;
    }
    
    setSelectedDocumentForUpload(document);
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setSelectedDocumentForUpload(null);
    setUploadModalOpen(false);
  };

  const handleDocumentUploaded = async () => {
    // Limpiar cache específico antes de recargar datos
    console.log('Documento cargado por admin, limpiando cache y recargando datos...');
    clearCache(`user-${studentId}`);
    clearCache(`user-docs-${studentId}`);
    clearUserProfileCache(`user-profile-${studentId}`);
    await handleReload();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
      default:
        return 'inherit';
    }
  };

  const getButtonColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'success';
      case 'rechazado':
        return 'error';
      case 'vencido':
        return 'warning';
      case 'pendiente':
        return 'info';
      case 'no aplica':
        return 'default';
      case 'sin cargar':
      default:
        return 'default';
    }
  };

  const handleStatusFilterClick = (status) => {
    if (statusFilter === status) {
      setStatusFilter('Todos');
    } else {
      setStatusFilter(status);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const clearAllFilters = () => {
    setStatusFilter('Todos');
    setSearchTerm('');
  };

  if (loading || modoSaturado) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Hay demasiadas solicitudes en la aplicación, esto puede tomar unos minutos...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ padding: 3, marginTop: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <IconButton
              size="small"
              onClick={() => navigate('/admin/dashboard')}
              sx={{ 
                color: 'primary.main', 
                borderRadius: 1.5,
                bgcolor: 'primary.light',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.25),
                } 
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6">Error al cargar usuario</Typography>
          </Stack>
          
          <Alert 
            severity={error.includes('alta demanda') ? 'warning' : 'error'} 
            sx={{ mb: 2 }}
            action={
              error.includes('alta demanda') ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption">Reintentando...</Typography>
                </Box>
              ) : null
            }
          >
            {error}
          </Alert>
          
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              onClick={handleReload}
              startIcon={<Refresh />}
            >
              Reintentar
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                clearCache();
                handleReload();
              }}
              startIcon={<Refresh />}
            >
              Limpiar Cache y Reintentar
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/admin/dashboard')}
            >
              Volver al Dashboard
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ padding: 3, marginTop: 12 }}>
        {/* Header con navegación y perfil */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <IconButton
            size="small"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              color: 'primary.main', 
              borderRadius: 1.5,
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.25),
              } 
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box flexGrow={1}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  width: 32,
                  height: 32,
                  fontSize: '1rem'
                }}
              >
                {student?.nombre.charAt(0)}{student?.apellido.charAt(0)}
              </Avatar>
              {student?.nombre} {student?.apellido}
              {/* Chip del rol */}
              <Chip 
                label={student?.rol}
                color={student?.rol === 'Docente' ? "primary" : "secondary"}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {student?.codigo} · {student?.programa} · {student?.sede}
              {/* Celular con enlace a WhatsApp */}
              {student?.celular && (
                <>
                  · {student.celular}
                  <IconButton 
                    size="small" 
                    component="a" 
                    href={`https://wa.me/${student.celular.replace(/\s+/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Chat with ${student.nombre} on WhatsApp`}
                    sx={{ 
                      color: 'success.main', 
                      ml: 0.5,
                      '&:hover': {
                        bgcolor: 'success.light'
                      }
                    }}
                  >
                    <WhatsApp fontSize="small" />
                  </IconButton>
                </>
              )}
            </Typography>
          </Box>
        </Stack>
        
        {/* Indicadores de estado - versión ultra minimalista y atractiva */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 3,
            overflowX: 'auto',
            pb: 1,
            '::-webkit-scrollbar': { height: 6 },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.13)',
              borderRadius: 3
            }
          }}
        >
          {/* Aprobados */}
          <Box
            onClick={() => handleStatusFilterClick('Aprobados')}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: statusFilter === 'Aprobados' ? 'success.main' : 'success.light',
              color: statusFilter === 'Aprobados' ? 'white' : 'success.main',
              boxShadow: statusFilter === 'Aprobados' ? '0 4px 20px rgba(76, 175, 80, 0.3)' : '0 2px 12px 0 rgba(76,175,80,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: statusFilter === 'Aprobados' ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 4px 18px 0 rgba(76,175,80,0.13)'
              }
            }}
          >
            <CheckCircle sx={{ color: statusFilter === 'Aprobados' ? 'white' : 'success.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ color: statusFilter === 'Aprobados' ? 'white' : 'success.main' }}>
                {documentStats.aprobados}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: statusFilter === 'Aprobados' ? 'rgba(255,255,255,0.9)' : 'success.dark', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5 
              }}>
                Aprobados
              </Typography>
            </Box>
          </Box>
          {/* Pendientes */}
          <Box
            onClick={() => handleStatusFilterClick('Pendientes')}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: statusFilter === 'Pendientes' ? 'info.main' : 'info.light',
              color: statusFilter === 'Pendientes' ? 'white' : 'info.main',
              boxShadow: statusFilter === 'Pendientes' ? '0 4px 20px rgba(33, 150, 243, 0.3)' : '0 2px 12px 0 rgba(33,150,243,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: statusFilter === 'Pendientes' ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 4px 18px 0 rgba(33,150,243,0.13)'
              }
            }}
          >
            <HourglassEmpty sx={{ color: statusFilter === 'Pendientes' ? 'white' : 'info.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ color: statusFilter === 'Pendientes' ? 'white' : 'info.main' }}>
                {documentStats.pendientes}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: statusFilter === 'Pendientes' ? 'rgba(255,255,255,0.9)' : 'info.dark', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5 
              }}>
                Pendientes
              </Typography>
            </Box>
          </Box>
          {/* Rechazados */}
          <Box
            onClick={() => handleStatusFilterClick('Rechazados')}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: statusFilter === 'Rechazados' ? 'error.main' : 'error.light',
              color: statusFilter === 'Rechazados' ? 'white' : 'error.main',
              boxShadow: statusFilter === 'Rechazados' ? '0 4px 20px rgba(244, 67, 54, 0.3)' : '0 2px 12px 0 rgba(244,67,54,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: statusFilter === 'Rechazados' ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 4px 18px 0 rgba(244,67,54,0.13)'
              }
            }}
          >
            <Cancel sx={{ color: statusFilter === 'Rechazados' ? 'white' : 'error.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ color: statusFilter === 'Rechazados' ? 'white' : 'error.main' }}>
                {documentStats.rechazados}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: statusFilter === 'Rechazados' ? 'rgba(255,255,255,0.9)' : 'error.dark', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5 
              }}>
                Rechazados
              </Typography>
            </Box>
          </Box>
          {/* Vencidos */}
          <Box
            onClick={() => handleStatusFilterClick('Vencidos')}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: statusFilter === 'Vencidos' ? 'warning.main' : 'warning.light',
              color: statusFilter === 'Vencidos' ? 'white' : 'warning.main',
              boxShadow: statusFilter === 'Vencidos' ? '0 4px 20px rgba(255, 152, 0, 0.3)' : '0 2px 12px 0 rgba(255,152,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: statusFilter === 'Vencidos' ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 4px 18px 0 rgba(255,152,0,0.13)'
              }
            }}
          >
            <Warning sx={{ color: statusFilter === 'Vencidos' ? 'white' : 'warning.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ color: statusFilter === 'Vencidos' ? 'white' : 'warning.main' }}>
                {documentStats.vencidos}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: statusFilter === 'Vencidos' ? 'rgba(255,255,255,0.9)' : 'warning.dark', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5 
              }}>
                Vencidos
              </Typography>
            </Box>
          </Box>
          {/* Sin cargar */}
          <Box
            onClick={() => handleStatusFilterClick('Sin cargar')}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: statusFilter === 'Sin cargar' ? '#616161' : '#f5f5f5',
              color: statusFilter === 'Sin cargar' ? 'white' : 'text.secondary',
              boxShadow: statusFilter === 'Sin cargar' ? '0 4px 20px rgba(97, 97, 97, 0.3)' : '0 2px 12px 0 rgba(120,120,120,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: statusFilter === 'Sin cargar' ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: '0 4px 18px 0 rgba(120,120,120,0.13)'
              }
            }}
          >
            <CloudOff sx={{ color: statusFilter === 'Sin cargar' ? 'white' : 'text.secondary', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ color: statusFilter === 'Sin cargar' ? 'white' : 'text.secondary' }}>
                {documentStats.sinCargar}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: statusFilter === 'Sin cargar' ? 'rgba(255,255,255,0.9)' : 'text.secondary', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5 
              }}>
                Sin cargar
              </Typography>
            </Box>
          </Box>
        </Stack>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Sección de filtros */}
        <Box sx={{ mb: 3 }}>
          {/* Indicadores de filtros activos */}
          {(statusFilter !== 'Todos' || searchTerm !== '') && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Filtros activos:
                </Typography>
                {statusFilter !== 'Todos' && (
                  <Chip 
                    label={`Estado: ${statusFilter}`} 
                    size="small" 
                    onDelete={() => setStatusFilter('Todos')}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {searchTerm !== '' && (
                  <Chip 
                    label={`Búsqueda: "${searchTerm}"`} 
                    size="small" 
                    onDelete={() => setSearchTerm('')}
                    color="default"
                    variant="outlined"
                  />
                )}
                <Button 
                  size="small" 
                  onClick={clearAllFilters}
                  sx={{ ml: 1 }}
                >
                  Limpiar filtros
                </Button>
              </Box>
            </Stack>
          )}
          
          {/* Barra de búsqueda */}
          <TextField
            fullWidth
            placeholder="Buscar documentos por nombre o comentarios..."
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
                  <IconButton onClick={handleClearSearch} edge="end">
                    <Cancel />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
        </Box>
        
        {/* Tabla de documentos */}
        <Paper 
          sx={{ 
            width: '100%', 
            overflow: 'hidden', 
            mb: 4,
            borderRadius: 2, 
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <TableContainer>
            <Table stickyHeader size="small" aria-label="tabla de documentos">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Documento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Expedición</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Comentarios</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }} align="center">Acciones</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }} align="center">Cargar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        {student?.documentos?.length === 0 ? 
                          'No hay documentos cargados para este usuario.' :
                          'No se encontraron documentos que coincidan con los filtros aplicados.'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    doc.isDoseGroup ? (
                      // Renderizar grupo de dosis como acordeón
                      <TableRow
                        key={`dose-group-${doc.id}`}
                        sx={{ backgroundColor: getRowBackground(doc.estado) }}
                      >
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Accordion 
                            sx={{ 
                              boxShadow: 'none',
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:before': { display: 'none' },
                              '&.Mui-expanded': { margin: 0 }
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMore />}
                              sx={{
                                backgroundColor: getRowBackground(doc.estado),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.grey[300], 0.3),
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                <Avatar sx={{ 
                                  width: 32, 
                                  height: 32,
                                  backgroundColor: theme.palette.primary.main,
                                  color: 'white'
                                }}>
                                  <VaccinesOutlined fontSize="small" />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 600,
                                    color: theme.palette.secondary.main,
                                    mb: 0.25,
                                    fontSize: '0.85rem'
                                  }}>
                                    {doc.nombre}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip
                                      label={doc.progress || `0/${doc.totalDoses}`}
                                      size="small"
                                      sx={{
                                        backgroundColor: theme.palette.primary.light,
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '0.65rem',
                                        height: '20px'
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {doc.completedDoses || 0} aprobadas
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                                  <StatusChip status={doc.estado} />
                                  <Typography variant="caption" color="text.secondary">
                                    {doc.fechaCargue ? `Última carga: ${formatDate(doc.fechaCargue)}` : 'Sin cargar'}
                                  </Typography>
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 2 }}>
                              <Grid container spacing={2}>
                                {doc.doseStatuses?.map((doseInfo, doseIndex) => (
                                  <Grid item xs={12} sm={6} md={4} key={`dose-${doseInfo.doseNumber}-${doseIndex}`}>
                                    <Card 
                                      sx={{ 
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        backgroundColor: getRowBackground(doseInfo.status),
                                        '&:hover': {
                                          borderColor: theme.palette.primary.main,
                                          boxShadow: '0 4px 12px rgba(178, 34, 34, 0.1)',
                                          transform: 'translateY(-2px)',
                                          transition: 'all 0.2s ease'
                                        }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                          {doc.baseDoc?.nombre_doc?.toLowerCase().includes('covid') 
                                            ? doseInfo.doseNumber 
                                            : `Dosis ${doseInfo.doseNumber}`}
                                        </Typography>
                                        <StatusChip status={doseInfo.status} />
                                      </Box>
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {doseInfo.userDoc?.fecha_cargue ? `Cargado: ${formatDate(doseInfo.userDoc.fecha_cargue)}` : 'No cargado'}
                                        </Typography>
                                        {doseInfo.userDoc?.fecha_expedicion && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Expedición: {formatDate(doseInfo.userDoc.fecha_expedicion)}
                                          </Typography>
                                        )}
                                        {doseInfo.userDoc?.fecha_vencimiento && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Vencimiento: {formatDate(doseInfo.userDoc.fecha_vencimiento)}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                        {doseInfo.userDoc?.comentarios && (
                                          <Tooltip title={doseInfo.userDoc.comentarios}>
                                            <Typography variant="caption" sx={{
                                              maxWidth: 120,
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              color: 'text.secondary'
                                            }}>
                                              {doseInfo.userDoc.comentarios}
                                            </Typography>
                                          </Tooltip>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          {doseInfo.userDoc?.ruta_archivo && (
                                            <Tooltip title="Ver documento">
                                              <IconButton
                                                size="small"
                                                onClick={() => window.open(doseInfo.userDoc.ruta_archivo, '_blank', 'noopener,noreferrer')}
                                                sx={{
                                                  bgcolor: 'primary.light',
                                                  color: 'primary.main',
                                                  '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.25),
                                                  }
                                                }}
                                              >
                                                <Visibility fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          
                                          {/* Botón para cargar documento si está sin cargar */}
                                          {doseInfo.status === 'sin cargar' && (
                                            <Tooltip title="Cargar documento">
                                              <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<CloudUpload fontSize="inherit" />}
                                                onClick={() => handleOpenUploadModal({
                                                  id: doc.baseDoc.id_doc || doc.baseDoc.id_tipoDoc || doc.id,
                                                  nombre: `${doc.nombre} - ${doc.baseDoc?.nombre_doc?.toLowerCase().includes('covid') ? doseInfo.doseNumber : `Dosis ${doseInfo.doseNumber}`}`,
                                                  vence: doc.vence,
                                                  tiempo_vencimiento: doc.baseDoc?.tiempo_vencimiento
                                                })}
                                                sx={{ 
                                                  px: 1.5, 
                                                  py: 0.4, 
                                                  minWidth: 'auto',
                                                  fontSize: '0.65rem',
                                                  backgroundColor: '#4CAF50',
                                                  color: 'white',
                                                  borderRadius: 1.5,
                                                  boxShadow: '0 2px 6px rgba(76, 175, 80, 0.25)',
                                                  '&:hover': {
                                                    backgroundColor: '#45A049',
                                                    boxShadow: '0 3px 10px rgba(76, 175, 80, 0.35)',
                                                    transform: 'translateY(-1px)',
                                                  },
                                                  transition: 'all 0.2s ease-in-out'
                                                }}
                                              >
                                                Cargar
                                              </Button>
                                            </Tooltip>
                                          )}
                                          
                                          {doseInfo.userDoc && (
                                            <Tooltip title="Revisar dosis">
                                              <Button
                                                variant="outlined"
                                                color={getButtonColor(doseInfo.status)}
                                                size="small"
                                                onClick={() => handleOpenModal({
                                                  ...doseInfo.userDoc,
                                                  nombre: `${doc.nombre} - ${doc.baseDoc?.nombre_doc?.toLowerCase().includes('covid') ? doseInfo.doseNumber : `Dosis ${doseInfo.doseNumber}`}`,
                                                  vence: doc.vence
                                                })}
                                                sx={{ 
                                                  px: 1, 
                                                  py: 0.25, 
                                                  minWidth: 'auto',
                                                  fontSize: '0.7rem',
                                                  borderWidth: 1
                                                }}
                                              >
                                                Revisar
                                              </Button>
                                            </Tooltip>
                                          )}
                                        </Box>
                                      </Box>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Renderizar documento normal
                      <TableRow
                        key={doc.id}
                        hover
                        sx={{ backgroundColor: getRowBackground(doc.estado) }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {doc.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.fechaCargue ? `Cargado: ${formatDate(doc.fechaCargue)}` : 'No cargado'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={doc.estado} />
                        </TableCell>
                        <TableCell>{formatDate(doc.fechaExpedicion)}</TableCell>
                        <TableCell>
                          {doc.vence ? formatDate(doc.fechaVencimiento) : 'No vence'}
                        </TableCell>
                        <TableCell>
                          {doc.comentarios ? (
                            <Tooltip title={doc.comentarios}>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 150,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {doc.comentarios}
                              </Typography>
                            </Tooltip>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {doc.rutaArchivo && (
                              <Tooltip title="Ver documento">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={doc.rutaArchivo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ 
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.25),
                                    }
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            <Tooltip title={doc.estado === 'sin cargar' ? 'No hay documento para revisar' : 'Revisar documento'}>
                              <span>
                                <Button
                                  variant="outlined"
                                  color={getButtonColor(doc.estado)}
                                  size="small"
                                  onClick={() => handleOpenModal(doc)}
                                  disabled={doc.estado === 'sin cargar'}
                                  sx={{ 
                                    px: 1.5, 
                                    py: 0.5, 
                                    minWidth: 'auto',
                                    fontSize: '0.75rem',
                                    borderWidth: 1
                                  }}
                                >
                                  Revisar
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          {doc.estado === 'sin cargar' ? (
                            <Tooltip title="Cargar documento para este usuario">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CloudUpload fontSize="small" />}
                                onClick={() => handleOpenUploadModal({
                                  id: doc.id_tipo_documento || doc.id,
                                  nombre: doc.nombre,
                                  vence: doc.vence,
                                  tiempo_vencimiento: doc.tiempo_vencimiento || doc.tiempoVencimiento
                                })}
                                sx={{ 
                                  px: 2, 
                                  py: 0.75, 
                                  minWidth: 'auto',
                                  fontSize: '0.75rem',
                                  backgroundColor: '#e11025',
                                  color: 'white',
                                  borderRadius: 2,
                                  boxShadow: '0 2px 8px rgba(175, 76, 81, 0.3)',
                                  '&:hover': {
                                    backgroundColor: '#b30718',
                                    boxShadow: '0 4px 12px rgba(175, 76, 83, 0.4)',
                                    transform: 'translateY(-1px)',
                                  },
                                  transition: 'all 0.2s ease-in-out'
                                }}
                              >
                                Cargar archivo
                              </Button>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
      
      {/* Modal de revisión de documento */}
      {selectedDocument && (
        <DocumentReviewModal
          document={selectedDocument}
          onClose={handleCloseModal}
          studentName={`${student.nombre} ${student.apellido}`}
        />
      )}

      {/* Modal de carga de documento por admin */}
      {selectedDocumentForUpload && (
        <AdminDocumentUploadModal
          open={uploadModalOpen}
          onClose={handleCloseUploadModal}
          selectedDocument={selectedDocumentForUpload}
          studentInfo={student}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}

      {/* Indicador sutil en la UI */}
      {modoSaturado && (
        <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 2000 }}>
          <Autorenew sx={{ color: 'warning.main', animation: 'spin 1.5s linear infinite' }} />
          {/* O un CircularProgress pequeño */}
          {/* <CircularProgress size={24} color="warning" /> */}
        </Box>
      )}

      {/* Alert persistente o Snackbar */}
      <Snackbar open={modoSaturado} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="warning" sx={{ width: '100%' }}>
          Hay demasiadas solicitudes en la aplicación, esto puede tomar unos minutos.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default StudentDocumentManager;