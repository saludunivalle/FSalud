// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
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
  TablePagination,
  Card,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  CircularProgress,
  Button,
  ButtonGroup,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ReportGeneratorModal from './ReportGeneratorModal';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222',
    },
    secondary: {
      main: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#f2fef3',
    },
    warning: {
      main: '#ff9800',
      light: '#fff9ef',
    },
    error: {
      main: '#f44336',
      light: '#fff3f5',
    },
    info: {
      main: '#2196f3',
      light: '#f0f8ff',
    }
  },
});

// Datos de ejemplo
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
    documentosPendientes: 2,
    documentosAprobados: 3,
    documentosRechazados: 1,
    documentosVencidos: 1,
    documentosSinCargar: 3,
    programa: 'Medicina',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Hospital Universitario',
    rotacion: 'Pediatría',
    completado: false
  },
  {
    id: 2,
    nombre: 'María José',
    apellido: 'García López',
    codigo: '2045678',
    email: 'maria.garcia@correounivalle.edu.co',
    celular: '3012345678',
    rol: 'Docente',
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
    documentosSinCargar: 0,
    programa: 'Enfermería',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Clínica Valle del Lili',
    rotacion: 'Cuidados Intensivos',
    completado: true
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
    documentosPendientes: 1,
    documentosAprobados: 4,
    documentosRechazados: 1,
    documentosVencidos: 1,
    documentosSinCargar: 2,
    programa: 'Odontología',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Hospital Departamental',
    rotacion: 'Cirugía Oral',
    completado: false
  },
  {
    id: 4,
    nombre: 'Ana María',
    apellido: 'Martínez Solano',
    codigo: '2023456',
    email: 'ana.martinez@correounivalle.edu.co',
    celular: '3109876543',
    rol: 'Docente',
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
    documentosSinCargar: 0,
    programa: 'Fisioterapia',
    sede: 'Palmira',
    nivel: 'Pregrado',
    escenarios: 'Centro de Rehabilitación',
    rotacion: 'Fisioterapia Deportiva',
    completado: true
  },
  {
    id: 5,
    nombre: 'Luis Felipe',
    apellido: 'Hernández Torres',
    codigo: '2034567',
    email: 'luis.hernandez@correounivalle.edu.co',
    celular: '3118765432',
    rol: 'Estudiante',
    documentosFaltantes: 'Sí',
    documentosPendientes: 3,
    documentosAprobados: 2,
    documentosRechazados: 1,
    documentosVencidos: 0,
    documentosSinCargar: 4,
    programa: 'Bacteriología',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Laboratorio Clínico',
    rotacion: 'Microbiología',
    completado: false
  },
  {
    id: 6,
    nombre: 'Daniela',
    apellido: 'Sánchez Mejía',
    codigo: '2056789',
    email: 'daniela.sanchez@correounivalle.edu.co',
    celular: '3127654321',
    rol: 'Estudiante',
    documentosFaltantes: 'Sí',
    documentosPendientes: 1,
    documentosAprobados: 3,
    documentosRechazados: 2,
    documentosVencidos: 0,
    documentosSinCargar: 1,
    programa: 'Fonoaudiología',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Centro de Terapia del Lenguaje',
    rotacion: 'Trastornos del Habla',
    completado: false
  },
  {
    id: 7,
    nombre: 'Santiago',
    apellido: 'López Vidal',
    codigo: '2067890',
    email: 'santiago.lopez@correounivalle.edu.co',
    celular: '3136543210',
    rol: 'Docente',
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
    documentosSinCargar: 0,
    programa: 'Medicina',
    sede: 'Cali',
    nivel: 'Pregrado',
    escenarios: 'Hospital Infantil Club Noel',
    rotacion: 'Pediatría',
    completado: true
  }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para filtros
  const [roleFilter, setRoleFilter] = useState('Ambos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const [stats, setStats] = useState({
    pendingDocuments: 0,
    approvedStudents: 0,
    usersWithoutUploads: 0,
    rejectedDocuments: 0,
    expiredDocuments: 0
  });

  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStudents(mockStudents);
      
      // Calcular estadísticas
      const pendingDocuments = mockStudents.reduce((acc, student) => 
        acc + student.documentosPendientes, 0);
      const rejectedDocuments = mockStudents.reduce((acc, student) => 
        acc + student.documentosRechazados, 0);
      const expiredDocuments = mockStudents.reduce((acc, student) => 
        acc + student.documentosVencidos, 0);
      const approvedStudents = mockStudents.filter(student => student.completado).length;
      const usersWithoutUploads = mockStudents.filter(student => student.documentosSinCargar > 0).length;
      
      setStats({
        pendingDocuments,
        approvedStudents,
        usersWithoutUploads,
        rejectedDocuments,
        expiredDocuments
      });
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Efecto para filtrar estudiantes
  useEffect(() => {
    let filtered = students;
    
    // Filtrar por rol
    if (roleFilter !== 'Ambos') {
      filtered = filtered.filter(student => student.rol === roleFilter);
    }
    
    // Filtrar por estado de documentación
    if (statusFilter === 'Completos') {
      filtered = filtered.filter(student => student.completado);
    } else if (statusFilter === 'Pendientes') {
      filtered = filtered.filter(student => student.documentosPendientes > 0);
    } else if (statusFilter === 'Rechazados') {
      filtered = filtered.filter(student => student.documentosRechazados > 0);
    } else if (statusFilter === 'Vencidos') {
      filtered = filtered.filter(student => student.documentosVencidos > 0);
    } else if (statusFilter === 'Sin cargar') {
      filtered = filtered.filter(student => student.documentosSinCargar > 0);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm !== '') {
      filtered = filtered.filter(student => 
        student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.celular && student.celular.toLowerCase().includes(searchTerm.toLowerCase())) ||
        student.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredStudents(filtered);
    setPage(0);
  }, [searchTerm, students, roleFilter, statusFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleStudentClick = (studentId) => {
    navigate(`/admin/student/${studentId}`);
  };

  const handleRoleFilterChange = (newRole) => {
    setRoleFilter(newRole);
  };

  const handleStatusFilterClick = (status) => {
    if (statusFilter === status) {
      setStatusFilter('Todos');
    } else {
      setStatusFilter(status);
    }
  };

  const clearAllFilters = () => {
    setRoleFilter('Ambos');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Panel de Administración
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={() => setReportModalOpen(true)}
          >
            Generar Reporte
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Gestión de documentos de usuarios para escenarios de práctica.
        </Typography>
        
        {/* Cards de estadísticas - 5 tarjetas */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Usuarios Aprobados */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              onClick={() => handleStatusFilterClick('Completos')}
              sx={{
                height: '100%',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 2,
                backgroundColor: statusFilter === 'Completos' ? 'success.main' : 'success.light',
                boxShadow: statusFilter === 'Completos' ? '0 4px 20px rgba(76, 175, 80, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: statusFilter === 'Completos' ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <AssignmentTurnedInIcon sx={{ 
                  fontSize: 24, 
                  color: statusFilter === 'Completos' ? 'white' : 'success.main' 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Completos' ? 'white' : 'success.main' 
                }}>
                  {stats.approvedStudents}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Completos' ? 'white' : 'success.dark',
                  mb: 0.5
                }}>
                  Aprobados
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: statusFilter === 'Completos' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  lineHeight: 1.2,
                  fontSize: '0.7rem'
                }}>
                  Documentación completa
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Documentos Pendientes */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              onClick={() => handleStatusFilterClick('Pendientes')}
              sx={{
                height: '100%',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 2,
                backgroundColor: statusFilter === 'Pendientes' ? 'info.main' : 'info.light',
                boxShadow: statusFilter === 'Pendientes' ? '0 4px 20px rgba(33, 150, 243, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: statusFilter === 'Pendientes' ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.2)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <AssignmentLateIcon sx={{ 
                  fontSize: 24, 
                  color: statusFilter === 'Pendientes' ? 'white' : 'info.main' 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Pendientes' ? 'white' : 'info.main' 
                }}>
                  {stats.pendingDocuments}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Pendientes' ? 'white' : 'info.dark',
                  mb: 0.5
                }}>
                  Pendientes
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: statusFilter === 'Pendientes' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  lineHeight: 1.2,
                  fontSize: '0.7rem'
                }}>
                  Esperando revisión
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Documentos Vencidos */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              onClick={() => handleStatusFilterClick('Vencidos')}
              sx={{
                height: '100%',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 2,
                backgroundColor: statusFilter === 'Vencidos' ? 'warning.main' : 'warning.light',
                boxShadow: statusFilter === 'Vencidos' ? '0 4px 20px rgba(255, 152, 0, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: statusFilter === 'Vencidos' ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 20px rgba(255, 152, 0, 0.2)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <WarningIcon sx={{ 
                  fontSize: 24, 
                  color: statusFilter === 'Vencidos' ? 'white' : 'warning.main' 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Vencidos' ? 'white' : 'warning.main' 
                }}>
                  {stats.expiredDocuments}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Vencidos' ? 'white' : 'warning.dark',
                  mb: 0.5
                }}>
                  Vencidos
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: statusFilter === 'Vencidos' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  lineHeight: 1.2,
                  fontSize: '0.7rem'
                }}>
                  Requieren renovación
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Documentos Rechazados */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              onClick={() => handleStatusFilterClick('Rechazados')}
              sx={{
                height: '100%',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 2,
                backgroundColor: statusFilter === 'Rechazados' ? 'error.main' : 'error.light',
                boxShadow: statusFilter === 'Rechazados' ? '0 4px 20px rgba(244, 67, 54, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: statusFilter === 'Rechazados' ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 20px rgba(244, 67, 54, 0.2)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <CancelIcon sx={{ 
                  fontSize: 24, 
                  color: statusFilter === 'Rechazados' ? 'white' : 'error.main' 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Rechazados' ? 'white' : 'error.main' 
                }}>
                  {stats.rejectedDocuments}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Rechazados' ? 'white' : 'error.dark',
                  mb: 0.5
                }}>
                  Rechazados
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: statusFilter === 'Rechazados' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                  lineHeight: 1.2,
                  fontSize: '0.7rem'
                }}>
                  Necesitan corrección
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Usuarios Sin Cargar */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              onClick={() => handleStatusFilterClick('Sin cargar')}
              sx={{
                height: '100%',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 2,
                backgroundColor: statusFilter === 'Sin cargar' ? '#616161' : '#f5f5f5',
                boxShadow: statusFilter === 'Sin cargar' ? '0 4px 20px rgba(97, 97, 97, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: statusFilter === 'Sin cargar' ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 20px rgba(97, 97, 97, 0.2)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <DescriptionIcon sx={{ 
                  fontSize: 24, 
                  color: statusFilter === 'Sin cargar' ? 'white' : '#616161' 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Sin cargar' ? 'white' : '#616161' 
                }}>
                  {stats.usersWithoutUploads}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: statusFilter === 'Sin cargar' ? 'white' : '#424242',
                  mb: 0.5
                }}>
                  Sin Cargar
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: statusFilter === 'Sin cargar' ? 'rgba(255,255,255,0.9)' : '#666',
                  lineHeight: 1.2,
                  fontSize: '0.7rem'
                }}>
                  No han subido documentos
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Filtros por rol y estado */}
        <Box sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
            {/* Filtro por rol */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                Filtrar por rol:
              </Typography>
              <ButtonGroup size="small" sx={{ bgcolor: 'background.paper' }}>
                <Button
                  variant={roleFilter === 'Ambos' ? 'contained' : 'outlined'}
                  startIcon={<PeopleIcon fontSize="small" />}
                  onClick={() => handleRoleFilterChange('Ambos')}
                  sx={{ 
                    borderColor: 'divider',
                    '&.Mui-focusVisible': { zIndex: 1 }
                  }}
                >
                  Ambos
                </Button>
                <Button
                  variant={roleFilter === 'Estudiante' ? 'contained' : 'outlined'}
                  startIcon={<SchoolIcon fontSize="small" />}
                  onClick={() => handleRoleFilterChange('Estudiante')}
                  sx={{ 
                    borderColor: 'divider',
                    '&.Mui-focusVisible': { zIndex: 1 }
                  }}
                >
                  Estudiantes
                </Button>
                <Button
                  variant={roleFilter === 'Docente' ? 'contained' : 'outlined'}
                  startIcon={<PersonOutlineIcon fontSize="small" />}
                  onClick={() => handleRoleFilterChange('Docente')}
                  sx={{ 
                    borderColor: 'divider',
                    '&.Mui-focusVisible': { zIndex: 1 }
                  }}
                >
                  Docentes
                </Button>
              </ButtonGroup>
            </Box>
            
            {/* Indicadores de filtros activos */}
            {(roleFilter !== 'Ambos' || statusFilter !== 'Todos' || searchTerm !== '') && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Filtros activos:
                </Typography>
                {roleFilter !== 'Ambos' && (
                  <Chip 
                    label={`Rol: ${roleFilter}`} 
                    size="small" 
                    onDelete={() => setRoleFilter('Ambos')}
                    color="primary"
                    variant="outlined"
                  />
                )}
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
            )}
          </Stack>
        </Box>
        
        {/* Barra de búsqueda */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, apellido, código, correo, programa o rol..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end">
                    <CancelIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {/* Tabla de usuarios */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table aria-label="tabla de usuarios">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Celular</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cédula</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Programa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Documentos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((student) => (
                      <TableRow
                        hover
                        key={student.id}
                        onClick={() => handleStudentClick(student.id)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: student.completado ? 'success.light' : 'inherit',
                          '&:hover': {
                            backgroundColor: student.completado ? '#d7eed7' : '#f5f5f5'
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar 
                              sx={{ 
                                bgcolor: student.completado ? 'success.main' : 'primary.main',
                                mr: 2
                              }}
                            >
                              {student.nombre.charAt(0)}{student.apellido.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {student.nombre} {student.apellido}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {student.celular ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">{student.celular}</Typography>
                              <IconButton 
                                size="small" 
                                component="a" 
                                href={`https://wa.me/${student.celular.replace(/\s+/g, '')}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label={`Chat with ${student.nombre} on WhatsApp`}
                                sx={{ color: 'success.main' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{student.codigo || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={student.rol}
                            color={student.rol === 'Docente' ? "primary" : "secondary"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`Sede: ${student.sede} | Nivel: ${student.nivel}`}>
                            <Box>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                {student.programa}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.completado ? "Completo" : "Incompleto"}
                            color={student.completado ? "success" : "warning"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                            {/* Total de documentos */}
                            <Chip 
                              size="small" 
                              label={`${student.documentosAprobados}/${student.documentosAprobados + student.documentosPendientes + student.documentosRechazados + student.documentosVencidos + student.documentosSinCargar}`}
                              sx={{ 
                                bgcolor: student.completado ? 'success.light' : 'grey.200', 
                                color: student.completado ? 'success.dark' : 'text.secondary',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                minWidth: '45px'
                              }} 
                            />
                            
                            {/* Indicador de Pendientes - siempre visible */}
                            <Tooltip title={`${student.documentosPendientes} pendientes de revisión`}>
                              <Chip 
                                size="small" 
                                label={student.documentosPendientes} 
                                sx={{ 
                                  bgcolor: student.documentosPendientes > 0 ? 'info.light' : 'rgba(33, 150, 243, 0.1)', 
                                  color: student.documentosPendientes > 0 ? 'info.dark' : 'rgba(33, 150, 243, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosPendientes > 0 ? 1 : 0.6,
                                  border: student.documentosPendientes === 0 ? '1px solid rgba(33, 150, 243, 0.2)' : 'none'
                                }} 
                              />
                            </Tooltip>
                            
                            {/* Indicador de Vencidos - siempre visible */}
                            <Tooltip title={`${student.documentosVencidos} documentos vencidos`}>
                              <Chip 
                                size="small" 
                                label={student.documentosVencidos} 
                                sx={{ 
                                  bgcolor: student.documentosVencidos > 0 ? 'warning.light' : 'rgba(255, 152, 0, 0.1)', 
                                  color: student.documentosVencidos > 0 ? 'warning.dark' : 'rgba(255, 152, 0, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosVencidos > 0 ? 1 : 0.6,
                                  border: student.documentosVencidos === 0 ? '1px solid rgba(255, 152, 0, 0.2)' : 'none'
                                }} 
                              />
                            </Tooltip>
                            
                            {/* Indicador de Rechazados - siempre visible */}
                            <Tooltip title={`${student.documentosRechazados} rechazados, requieren corrección`}>
                              <Chip 
                                size="small" 
                                label={student.documentosRechazados} 
                                sx={{ 
                                  bgcolor: student.documentosRechazados > 0 ? 'error.light' : 'rgba(244, 67, 54, 0.1)', 
                                  color: student.documentosRechazados > 0 ? 'error.dark' : 'rgba(244, 67, 54, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosRechazados > 0 ? 1 : 0.6,
                                  border: student.documentosRechazados === 0 ? '1px solid rgba(244, 67, 54, 0.2)' : 'none'
                                }} 
                              />
                            </Tooltip>
                            
                            {/* Indicador de Sin Cargar - siempre visible */}
                            <Tooltip title={`${student.documentosSinCargar} sin cargar`}>
                              <Chip 
                                size="small" 
                                label={student.documentosSinCargar} 
                                sx={{ 
                                  bgcolor: student.documentosSinCargar > 0 ? '#f5f5f5' : 'rgba(97, 97, 97, 0.1)', 
                                  color: student.documentosSinCargar > 0 ? '#616161' : 'rgba(97, 97, 97, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosSinCargar > 0 ? 1 : 0.6,
                                  border: student.documentosSinCargar > 0 ? '1px solid #e0e0e0' : '1px solid rgba(97, 97, 97, 0.2)'
                                }} 
                              />
                            </Tooltip>
                          </Box>
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
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
        
        <ReportGeneratorModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;