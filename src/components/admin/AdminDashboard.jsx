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
import RefreshIcon from '@mui/icons-material/Refresh';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ReportGeneratorModal from './ReportGeneratorModal';
import { getAllUsers, transformUsersForDashboard, getUsersWithDocumentStats } from '../../services/userService';

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
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
      setError(null);
      try {
        console.log('Cargando datos de usuarios y estadísticas...');
        
        // Obtener usuarios con estadísticas de documentos (no necesitamos estadísticas generales del backend)
        const usersWithStats = await getUsersWithDocumentStats();
        
        console.log('Respuesta de usuarios con estadísticas:', usersWithStats);
        
        // Verificar que tenemos datos reales
        if (!usersWithStats || usersWithStats.length === 0) {
          throw new Error('No se encontraron usuarios en la base de datos');
        }
        
        // Procesar usuarios
        const transformedUsers = transformUsersForDashboard(usersWithStats);
        
        console.log('Usuarios transformados en AdminDashboard:', transformedUsers.map(u => ({ 
          nombre: u.nombre, 
          apellido: u.apellido,
          aprobados: u.documentosAprobados, 
          pendientes: u.documentosPendientes,
          rechazados: u.documentosRechazados,
          vencidos: u.documentosVencidos,
          sinCargar: u.documentosSinCargar,
          total: u.totalDocumentosRequeridos,
          indicador: `${u.documentosAprobados}/${u.totalDocumentosRequeridos || 'undefined'}`,
          hasRealData: u.totalDocumentosRequeridos !== undefined
        })));
        
        if (transformedUsers.length === 0) {
          throw new Error('No se pudieron procesar los datos de usuarios');
        }
        
        // Log específico para documentos pendientes
        const usuariosConPendientes = transformedUsers.filter(u => u.documentosPendientes > 0);
        console.log('🔍 Usuarios con documentos pendientes:', usuariosConPendientes.map(u => ({
          nombre: `${u.nombre} ${u.apellido}`,
          pendientes: u.documentosPendientes,
          aprobados: u.documentosAprobados,
          total: u.totalDocumentosRequeridos
        })));
        
        if (usuariosConPendientes.length === 0) {
          console.warn('⚠️ No se encontraron usuarios con documentos pendientes en la API');
        } else {
          console.log(`✅ Encontrados ${usuariosConPendientes.length} usuarios con documentos pendientes`);
        }
        
        setStudents(transformedUsers);
        
        // Calcular TODAS las estadísticas en el frontend para asegurar consistencia
        const approvedStudents = transformedUsers.filter(student => student.completado).length;
        const usersWithoutUploads = transformedUsers.filter(student => student.documentosSinCargar > 0).length;
        
        // Sumar todos los documentos pendientes/rechazados/vencidos de todos los usuarios
        const totalPendingDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosPendientes, 0);
        const totalRejectedDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosRechazados, 0);
        const totalExpiredDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosVencidos, 0);
        
        console.log('📊 Estadísticas calculadas en frontend:', {
          totalUsuarios: transformedUsers.length,
          usuariosCompletos: approvedStudents,
          usuariosSinCargar: usersWithoutUploads,
          documentosPendientes: totalPendingDocuments,
          documentosRechazados: totalRejectedDocuments,
          documentosVencidos: totalExpiredDocuments
        });
        
        setStats({
          pendingDocuments: totalPendingDocuments,
          approvedStudents: approvedStudents,
          usersWithoutUploads: usersWithoutUploads,
          rejectedDocuments: totalRejectedDocuments,
          expiredDocuments: totalExpiredDocuments
        });
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError(error.message || 'Error cargando datos del dashboard');
        // En caso de error, usar datos vacíos
        setStudents([]);
        setStats({
          pendingDocuments: 0,
          approvedStudents: 0,
          usersWithoutUploads: 0,
          rejectedDocuments: 0,
          expiredDocuments: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Función para recargar datos
  const handleRetry = () => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Recargando datos...');
        
        // Obtener usuarios con estadísticas de documentos (no necesitamos estadísticas generales del backend)
        const usersWithStats = await getUsersWithDocumentStats();
        
        // Verificar que tenemos datos reales
        if (!usersWithStats || usersWithStats.length === 0) {
          throw new Error('No se encontraron usuarios en la base de datos');
        }
        
        const transformedUsers = transformUsersForDashboard(usersWithStats);
        
        if (transformedUsers.length === 0) {
          throw new Error('No se pudieron procesar los datos de usuarios');
        }
        
        setStudents(transformedUsers);
        
        // Calcular TODAS las estadísticas en el frontend para asegurar consistencia
        const approvedStudents = transformedUsers.filter(student => student.completado).length;
        const usersWithoutUploads = transformedUsers.filter(student => student.documentosSinCargar > 0).length;
        
        // Sumar todos los documentos pendientes/rechazados/vencidos de todos los usuarios
        const totalPendingDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosPendientes, 0);
        const totalRejectedDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosRechazados, 0);
        const totalExpiredDocuments = transformedUsers.reduce((sum, user) => sum + user.documentosVencidos, 0);
        
        setStats({
          pendingDocuments: totalPendingDocuments,
          approvedStudents: approvedStudents,
          usersWithoutUploads: usersWithoutUploads,
          rejectedDocuments: totalRejectedDocuments,
          expiredDocuments: totalExpiredDocuments
        });
        
        console.log('✅ Datos recargados exitosamente desde la API:', {
          totalUsuarios: transformedUsers.length,
          usuariosConDatosReales: transformedUsers.filter(u => u.totalDocumentosRequeridos !== undefined).length
        });
        
      } catch (error) {
        console.error('Error recargando datos:', error);
        setError(error.message || 'Error recargando datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  };

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

  // Función de debug para verificar datos en consola
  const debugData = () => {
    console.log('=== DEBUG ADMIN DASHBOARD ===');
    console.log('Total de estudiantes:', students.length);
    console.log('Estudiantes con datos reales:', students.filter(s => s.totalDocumentosRequeridos !== undefined).length);
    
    // Debug específico para documentos pendientes
    const usuariosConPendientes = students.filter(s => s.documentosPendientes > 0);
    console.log('\n📋 ANÁLISIS DE DOCUMENTOS PENDIENTES:');
    console.log(`- Usuarios con documentos pendientes: ${usuariosConPendientes.length}`);
    console.log(`- Total documentos pendientes en el sistema: ${students.reduce((sum, s) => sum + (s.documentosPendientes || 0), 0)}`);
    
    if (usuariosConPendientes.length > 0) {
      console.log('\n📝 Detalle de usuarios con documentos pendientes:');
      usuariosConPendientes.forEach(student => {
        console.log(`  • ${student.nombre} ${student.apellido}:`);
        console.log(`    - Pendientes: ${student.documentosPendientes}`);
        console.log(`    - Aprobados: ${student.documentosAprobados}`);
        console.log(`    - Total requeridos: ${student.totalDocumentosRequeridos || 'N/A'}`);
      });
    } else {
      console.warn('⚠️ NO SE ENCONTRARON USUARIOS CON DOCUMENTOS PENDIENTES');
      console.log('Esto podría indicar:');
      console.log('1. Todos los documentos están aprobados/rechazados/vencidos');
      console.log('2. Los usuarios no han subido documentos aún');
      console.log('3. Problema en la carga de datos desde la API');
    }
    
    console.log('\n📊 Muestra de datos de estudiantes:');
    students.slice(0, 3).forEach(student => {
      console.log(`- ${student.nombre} ${student.apellido}:`);
      console.log(`  Aprobados: ${student.documentosAprobados}/${student.totalDocumentosRequeridos || 'N/A'}`);
      console.log(`  Pendientes: ${student.documentosPendientes} ⭐`);
      console.log(`  Rechazados: ${student.documentosRechazados}`);
      console.log(`  Vencidos: ${student.documentosVencidos}`);
      console.log(`  Sin cargar: ${student.documentosSinCargar}`);
      console.log(`  Completado: ${student.completado}`);
    });
    
    console.log('\n📈 Estadísticas generales:', stats);
    console.log('=== FIN DEBUG ===');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando datos del dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error al cargar los datos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleRetry}
          startIcon={<CancelIcon />}
        >
          Intentar de nuevo
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ padding: 3, marginTop: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Panel de Administración
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              disabled={loading}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={() => setReportModalOpen(true)}
            >
              Generar Reporte
            </Button>
          </Box>
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
                  {students.reduce((sum, student) => sum + student.documentosAprobados, 0)}
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
                  Documentos aprobados
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
                            <Tooltip title={
                              student.totalDocumentosRequeridos 
                                ? `Total real (con dosis): ${student.totalDocumentosRequeridos} documentos`
                                : `Calculado dinámicamente: ${student.documentosAprobados + student.documentosPendientes + student.documentosRechazados + student.documentosVencidos + student.documentosSinCargar} documentos`
                            }>
                              <Chip 
                                size="small" 
                                label={
                                  student.totalDocumentosRequeridos 
                                    ? `${student.documentosAprobados}/${student.totalDocumentosRequeridos}` 
                                    : `${student.documentosAprobados}/${student.documentosAprobados + student.documentosPendientes + student.documentosRechazados + student.documentosVencidos + student.documentosSinCargar}`
                                }
                                sx={{ 
                                  bgcolor: student.completado ? 'success.light' : 'grey.200', 
                                  color: student.completado ? 'success.dark' : 'text.secondary',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  minWidth: '45px'
                                }} 
                              />
                            </Tooltip>

                            {/* Indicador de Aprobados - siempre visible */}
                            <Tooltip title={`${student.documentosAprobados} documentos aprobados`}>
                              <Chip 
                                size="small" 
                                label={student.documentosAprobados} 
                                sx={{ 
                                  bgcolor: student.documentosAprobados > 0 ? 'success.light' : 'rgba(76, 175, 80, 0.1)', 
                                  color: student.documentosAprobados > 0 ? 'success.dark' : 'rgba(76, 175, 80, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosAprobados > 0 ? 1 : 0.6,
                                  border: student.documentosAprobados > 0 
                                    ? '2px solid #4caf50' 
                                    : '1px solid rgba(76, 175, 80, 0.2)',
                                  transform: student.documentosAprobados > 0 ? 'scale(1.1)' : 'scale(1)',
                                  boxShadow: student.documentosAprobados > 0 
                                    ? '0 2px 8px rgba(76, 175, 80, 0.3)' 
                                    : 'none'
                                }} 
                              />
                            </Tooltip>
                            
                            {/* Indicador de Pendientes - siempre visible */}
                            <Tooltip title={`${student.documentosPendientes || 0} documentos pendientes de revisión`}>
                              <Chip 
                                size="small" 
                                label={student.documentosPendientes || 0} 
                                sx={{ 
                                  bgcolor: student.documentosPendientes > 0 ? 'info.light' : 'rgba(33, 150, 243, 0.1)', 
                                  color: student.documentosPendientes > 0 ? 'info.dark' : 'rgba(33, 150, 243, 0.5)',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '25px',
                                  height: '24px',
                                  opacity: student.documentosPendientes > 0 ? 1 : 0.6,
                                  border: student.documentosPendientes > 0 
                                    ? '2px solid #2196f3' 
                                    : '1px solid rgba(33, 150, 243, 0.2)',
                                  // Hacer más visible cuando hay pendientes
                                  transform: student.documentosPendientes > 0 ? 'scale(1.1)' : 'scale(1)',
                                  boxShadow: student.documentosPendientes > 0 
                                    ? '0 2px 8px rgba(33, 150, 243, 0.3)' 
                                    : 'none'
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
          students={filteredStudents}
        />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;