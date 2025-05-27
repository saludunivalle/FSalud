// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext'; // Importar useUser
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
  CardContent,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
  Search, 
  Cancel, 
  Description, 
  AssignmentLate, 
  AssignmentTurnedIn, 
  People,
  FilterList,
  WhatsApp // Import WhatsApp icon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222', // Color rojo sangre toro (Universidad del Valle)
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
      light: '#f0f8ff ',
    }
  },
});

// Datos de ejemplo (esto se reemplazará con datos reales)
const mockStudents = [
  {
    id: 1,
    nombre: 'Juan Carlos',
    apellido: 'Pérez Mendoza',
    codigo: '2012345',
    email: 'juan.perez@correounivalle.edu.co',
    celular: '3001234567', // Nueva propiedad
    documentosFaltantes: 'Sí',
    documentosPendientes: 2,
    documentosAprobados: 3,
    documentosRechazados: 1,
    documentosVencidos: 0,
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
    celular: '3012345678', // Nueva propiedad
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
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
    celular: '3023456789', // Nueva propiedad
    documentosFaltantes: 'Sí',
    documentosPendientes: 1,
    documentosAprobados: 4,
    documentosRechazados: 1,
    documentosVencidos: 1,
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
    celular: '3109876543', // Nueva propiedad
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
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
    celular: '3118765432', // Nueva propiedad
    documentosFaltantes: 'Sí',
    documentosPendientes: 3,
    documentosAprobados: 2,
    documentosRechazados: 1,
    documentosVencidos: 0,
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
    celular: '3127654321', // Nueva propiedad
    documentosFaltantes: 'Sí',
    documentosPendientes: 1,
    documentosAprobados: 3,
    documentosRechazados: 2,
    documentosVencidos: 0,
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
    celular: '3136543210', // Nueva propiedad
    documentosFaltantes: 'No',
    documentosPendientes: 0,
    documentosAprobados: 6,
    documentosRechazados: 0,
    documentosVencidos: 0,
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
  const { user } = useUser(); // Obtener el usuario del contexto
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingDocuments: 0,
    approvedStudents: 0,
    incompleteStudents: 0
  });

  // Determinar si es profesor para cambiar los textos
  const isProfesor = user?.role === 'profesor';
  const userLabel = isProfesor ? 'usuarios' : 'estudiantes';

  useEffect(() => {
    // Simulando carga de datos
    const loadData = async () => {
      setLoading(true);
      // Simulando un retardo para mostrar el efecto de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      
      // Calcular estadísticas
      const totalStudents = mockStudents.length;
      const pendingDocuments = mockStudents.reduce((acc, student) => 
        acc + student.documentosPendientes + student.documentosRechazados, 0);
      const approvedStudents = mockStudents.filter(student => student.completado).length;
      const incompleteStudents = totalStudents - approvedStudents;
      
      setStats({
        totalStudents,
        pendingDocuments,
        approvedStudents,
        incompleteStudents
      });
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.celular && student.celular.toLowerCase().includes(searchTerm.toLowerCase())) || // Añadir filtro por celular
      student.programa.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStudents(filtered);
    setPage(0);
  }, [searchTerm, students]);

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
        <Typography variant="h5" gutterBottom>
          {isProfesor ? 'Dashboard de Profesor' : 'Dashboard de Administrador'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {isProfesor ? 'Gestión de documentos de usuarios para escenarios de práctica.' : 'Gestión de documentos de estudiantes para escenarios de práctica.'}
        </Typography>
        
        {/* Cards de estadísticas */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1.5,
                backgroundColor: 'success.light', // Fondo verde claro
                boxShadow: 'none',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <AssignmentTurnedIn sx={{ fontSize: 24, color: 'success.main' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                    Completos
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {isProfesor ? 'Usuarios con documentación completa' : 'Estudiantes con documentación completa'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {stats.approvedStudents}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1.5,
                backgroundColor: 'warning.light', // Fondo naranja claro
                boxShadow: 'none',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <AssignmentLate sx={{ fontSize: 24, color: 'warning.main' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                    Pendientes
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Documentos pendientes de revisión
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {stats.pendingDocuments}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1.5,
                backgroundColor: 'error.light', // Fondo rojo claro
                boxShadow: 'none',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Description sx={{ fontSize: 24, color: 'error.main' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                    Incompletos
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {isProfesor ? 'Usuarios con documentación incompleta' : 'Estudiantes con documentación incompleta'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {stats.incompleteStudents}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1.5,
                backgroundColor: 'info.light', // Fondo azul claro
                boxShadow: 'none',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <People sx={{ fontSize: 24, color: 'info.main' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                    {isProfesor ? 'Usuarios' : 'Estudiantes'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Total registrados
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {stats.totalStudents}
              </Typography>
            </Card>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Barra de búsqueda y filtros */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder={isProfesor ? "Buscar por nombre, apellido, código, correo o programa..." : "Buscar por nombre, apellido, código, correo o programa..."}
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
          />
        </Box>
        
        {/* Tabla de estudiantes */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table aria-label={isProfesor ? "tabla de usuarios" : "tabla de estudiantes"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>{isProfesor ? 'Usuario' : 'Estudiante'}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Celular</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cédula</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Programa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Documentos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center"> {/* colSpan remains 6 */}
                      <Typography variant="body1" sx={{ py: 2 }}>
                        {isProfesor ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No se encontraron estudiantes que coincidan con la búsqueda.'}
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
                                href={`https://wa.me/${student.celular.replace(/\s+/g, '')}`} // Remove spaces for the link
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label={`Chat with ${student.nombre} on WhatsApp`}
                                sx={{ color: 'success.main' }}
                                onClick={(e) => e.stopPropagation()} // Prevenir que se abra la ficha del estudiante
                              >
                                <WhatsApp fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{student.codigo || 'N/A'}</TableCell> {/* Cédula column */}
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
                          <Box display="flex" alignItems="center" gap={1}>
                            <Tooltip title="Aprobados">
                              <Chip 
                                size="small" 
                                label={student.documentosAprobados} 
                                sx={{ 
                                  bgcolor: 'success.light', 
                                  color: 'success.dark',
                                  fontWeight: 'bold',
                                  minWidth: '30px' 
                                }} 
                              />
                            </Tooltip>
                            <Tooltip title="Pendientes">
                              <Chip 
                                size="small" 
                                label={student.documentosPendientes} 
                                sx={{ 
                                  bgcolor: 'info.light', 
                                  color: 'info.dark',
                                  fontWeight: 'bold',
                                  minWidth: '30px' 
                                }} 
                              />
                            </Tooltip>
                            <Tooltip title="Rechazados">
                              <Chip 
                                size="small" 
                                label={student.documentosRechazados} 
                                sx={{ 
                                  bgcolor: 'error.light', 
                                  color: 'error.dark',
                                  fontWeight: 'bold',
                                  minWidth: '30px' 
                                }} 
                              />
                            </Tooltip>
                            <Tooltip title="Vencidos">
                              <Chip 
                                size="small" 
                                label={student.documentosVencidos} 
                                sx={{ 
                                  bgcolor: 'warning.light', 
                                  color: 'warning.dark',
                                  fontWeight: 'bold',
                                  minWidth: '30px' 
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
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;