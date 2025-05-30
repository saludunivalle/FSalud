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
  InputAdornment
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
  Search
} from '@mui/icons-material';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import DocumentReviewModal from './DocumentReviewModal';

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
    case 'no aplica':
      icon = <Block fontSize="small" />;
      color = 'default';
      label = 'No Aplica';
      break;
    case 'sin cargar':
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

// Datos de ejemplo (esto se reemplazará con datos reales)
const mockStudents = [
  {
    id: 1,
    nombre: 'Juan Carlos',
    apellido: 'Pérez Mendoza',
    codigo: '2012345',
    email: 'juan.perez@correounivalle.edu.co',
    celular: '3001234567',
    rol: 'Estudiante',
    documentosFaltantes: 'Sí',
    programa: 'Medicina',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Hospital Universitario',
    rotacion: 'Pediatría',
    completado: false,
    documentos: [
      {
        id: 1,
        nombre: 'Documento de Identidad',
        estado: 'aprobado',
        fechaExpedicion: '2020-01-15',
        fechaVencimiento: null,
        fechaCargue: '2023-10-10',
        fechaRevision: '2023-10-12',
        comentarios: 'Documento en regla.',
        rutaArchivo: 'https://example.com/doc1.pdf',
        vence: false
      },
      {
        id: 2,
        nombre: 'Carné de Vacunación',
        estado: 'rechazado',
        fechaExpedicion: '2022-05-20',
        fechaVencimiento: null,
        fechaCargue: '2023-10-11',
        fechaRevision: '2023-10-13',
        comentarios: 'Falta la vacuna contra la Hepatitis B.',
        rutaArchivo: 'https://example.com/doc2.pdf',
        vence: false
      },
      {
        id: 3,
        nombre: 'Seguro Estudiantil',
        estado: 'vencido',
        fechaExpedicion: '2023-01-01',
        fechaVencimiento: '2023-12-31',
        fechaCargue: '2023-01-05',
        fechaRevision: '2023-01-07',
        comentarios: 'Debe renovar antes del vencimiento.',
        rutaArchivo: 'https://example.com/doc3.pdf',
        vence: true
      },
      {
        id: 4,
        nombre: 'Examen Médico',
        estado: 'pendiente',
        fechaExpedicion: '2023-09-01',
        fechaVencimiento: '2024-09-01',
        fechaCargue: '2023-09-05',
        fechaRevision: null,
        comentarios: null,
        rutaArchivo: 'https://example.com/doc4.pdf',
        vence: true
      },
      {
        id: 5,
        nombre: 'Certificado de ARL',
        estado: 'aprobado',
        fechaExpedicion: '2023-08-15',
        fechaVencimiento: '2024-08-15',
        fechaCargue: '2023-08-20',
        fechaRevision: '2023-08-22',
        comentarios: 'Todo en orden.',
        rutaArchivo: 'https://example.com/doc5.pdf',
        vence: true
      },
      {
        id: 6,
        nombre: 'Carta de Compromiso',
        estado: 'sin cargar',
        fechaExpedicion: null,
        fechaVencimiento: null,
        fechaCargue: null,
        fechaRevision: null,
        comentarios: null,
        rutaArchivo: null,
        vence: false
      }
    ]
  },
  // Otros estudiantes para pruebas
  {
    id: 2,
    nombre: 'María José',
    apellido: 'García López',
    codigo: '2045678',
    email: 'maria.garcia@correounivalle.edu.co',
    celular: '3012345678',
    rol: 'Docente',
    documentosFaltantes: 'No',
    programa: 'Enfermería',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Clínica Valle del Lili',
    rotacion: 'Cuidados Intensivos',
    completado: true,
    documentos: [
      {
        id: 1,
        nombre: 'Documento de Identidad',
        estado: 'aprobado',
        fechaExpedicion: '2021-03-10',
        fechaVencimiento: null,
        fechaCargue: '2023-09-15',
        fechaRevision: '2023-09-16',
        comentarios: 'Documento verificado correctamente.',
        rutaArchivo: 'https://example.com/doc_maria1.pdf',
        vence: false
      },
      {
        id: 2,
        nombre: 'Carné de Vacunación',
        estado: 'aprobado',
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: null,
        fechaCargue: '2023-09-15',
        fechaRevision: '2023-09-16',
        comentarios: 'Esquema de vacunación completo.',
        rutaArchivo: 'https://example.com/doc_maria2.pdf',
        vence: false
      }
    ]
  },
  {
    id: 3,
    nombre: 'Carlos Andrés',
    apellido: 'Ramírez Roa',
    codigo: '2078901',
    email: 'carlos.ramirez@correounivalle.edu.co',
    celular: '3023456789',
    rol: 'Estudiante',
    documentosFaltantes: 'Sí',
    programa: 'Odontología',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Hospital Departamental',
    rotacion: 'Cirugía Oral',
    completado: false,
    documentos: [
      {
        id: 1,
        nombre: 'Documento de Identidad',
        estado: 'aprobado',
        fechaExpedicion: '2019-11-20',
        fechaVencimiento: null,
        fechaCargue: '2023-10-01',
        fechaRevision: '2023-10-02',
        comentarios: 'Documento en regla.',
        rutaArchivo: 'https://example.com/doc_carlos1.pdf',
        vence: false
      },
      {
        id: 2,
        nombre: 'Seguro Estudiantil',
        estado: 'pendiente',
        fechaExpedicion: '2023-08-01',
        fechaVencimiento: '2024-08-01',
        fechaCargue: '2023-10-01',
        fechaRevision: null,
        comentarios: null,
        rutaArchivo: 'https://example.com/doc_carlos2.pdf',
        vence: true
      }
    ]
  }
];

const StudentDocumentManager = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
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

  // Cargar datos del estudiante
  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      // Simulando un retardo para mostrar el efecto de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar el estudiante por ID en los datos de ejemplo
      const foundStudent = mockStudents.find(s => s.id === parseInt(studentId, 10));
      
      if (foundStudent) {
        setStudent(foundStudent);
        
        // Calcular estadísticas de documentos
        const stats = {
          aprobados: 0,
          pendientes: 0,
          rechazados: 0,
          vencidos: 0,
          sinCargar: 0
        };
        
        foundStudent.documentos.forEach(doc => {
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
              stats.sinCargar++;
              break;
            default:
              stats.sinCargar++;
              break;
          }
        });
        
        setDocumentStats(stats);
      } else {
        // Si no se encuentra el estudiante, podríamos redirigir al dashboard
        navigate('/admin/dashboard');
      }
      
      setLoading(false);
    };
    
    loadStudentData();
  }, [studentId, navigate]);

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
      // Actualizar el documento en la lista del estudiante
      const updatedDocs = student.documentos.map(doc => 
        doc.id === updatedDoc.id ? updatedDoc : doc
      );
      
      setStudent({
        ...student,
        documentos: updatedDocs
      });
      
      // Recalcular estadísticas
      const stats = {
        aprobados: 0,
        pendientes: 0,
        rechazados: 0,
        vencidos: 0,
        sinCargar: 0
      };
      
      updatedDocs.forEach(doc => {
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
            stats.sinCargar++;
            break;
          default:
            stats.sinCargar++;
            break;
        }
      });
      
      setDocumentStats(stats);
    }
    
    setSelectedDocument(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small" aria-label="tabla de documentos">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Documento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Expedición</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Comentarios</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
                  </TableRow>
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
    </ThemeProvider>
  );
};

export default StudentDocumentManager;