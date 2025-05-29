import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  CircularProgress,
  Typography,
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Alert,
  Fade,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import ClearIcon from '@mui/icons-material/Clear';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';

// Tema clínico profesional con tonos sangre de toro
const clinicalTheme = createTheme({
  palette: {
    primary: {
      main: '#B22222', // Sangre de toro
      light: '#DC6B6B',
      dark: '#8B0000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5F5F5', // Gris muy claro
      light: '#FFFFFF',
      dark: '#E0E0E0',
      contrastText: '#333333',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
    },
    success: {
      main: '#4CAF50',
      light: '#E8F5E8',
    },
    warning: {
      main: '#FF9800',
      light: '#FFF3E0',
    },
    error: {
      main: '#F44336',
      light: '#FFEBEE',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.85rem',
      color: '#666666',
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Definición de documentos basada en la estructura de la base de datos
const DOCUMENTOS = {
  IDENTIFICACION: {
    nombre: "Documento de identificación",
    tieneDosis: false
  },
  EPS: {
    nombre: "Carné de EPS",
    tieneDosis: false
  },
  HEPATITIS: {
    nombre: "Hepatitis B",
    tieneDosis: true,
    dosis: ["Dosis 1", "Dosis 2", "Dosis 3"]
  },
  TETANOS: {
    nombre: "Tétanos y Difteria",
    tieneDosis: true,
    dosis: ["Dosis 1", "Dosis 2", "Dosis 3"]
  },
  VARICELA: {
    nombre: "Varicela",
    tieneDosis: false
  },
  INFLUENZA: {
    nombre: "Influenza",
    tieneDosis: false
  },
  COVID: {
    nombre: "COVID-19",
    tieneDosis: true,
    dosis: ["Dosis 1", "Dosis 2", "Refuerzo"]
  }
};

// Función para formatear el estado del documento
const formatearEstadoDocumento = (estado, fecha) => {
  if (!estado || estado === 'Sin cargar') return "SIN CARGAR";
  
  const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString() : "";
  
  switch (estado.toLowerCase()) {
    case 'cumplido':
      return `APROBADO - ${fechaFormateada} - REVISIÓN`;
    case 'rechazado':
      return `RECHAZADO - ${fechaFormateada} - REVISIÓN`;
    case 'expirado':
      return `VENCIDO - ${fechaFormateada} - VENCIMIENTO`;
    case 'sin revisar':
    case 'pending':
      return "PENDIENTE REVISIÓN";
    case 'no aplica':
      return "NO APLICA";
    default:
      return "SIN CARGAR";
  }
};

const ReportGeneratorModal = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    documentStatus: 'all',
    dateRange: 'all'
  });
  const [documentos, setDocumentos] = useState([]);

  // Cargar usuarios y documentos reales al abrir el modal
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // PASO 1: Obtener TODOS los tipos de documentos de la hoja DOCUMENTOS
          const docsResponse = await axios.get('http://localhost:3001/api/documents');
          const documentTypes = docsResponse.data || [];
          
          // PASO 2: Crear TODAS las columnas basadas en la hoja DOCUMENTOS (nombre_doc)
          const documentColumns = [];
          documentTypes.forEach(docType => {
            const nombreDoc = docType.nombre_doc;
            const dosis = parseInt(docType.dosis) || 1;
            
            if (dosis > 1) {
              // Crear columnas separadas para cada dosis
              for (let i = 1; i <= dosis; i++) {
                documentColumns.push(`${nombreDoc} - Dosis ${i}`);
              }
            } else {
              // Documento simple
              documentColumns.push(nombreDoc);
            }
          });
          
          console.log('Columnas de documentos creadas desde DOCUMENTOS sheet:', documentColumns);
          
          // PASO 3: Obtener todos los usuarios de la hoja USUARIOS
          const usersResponse = await axios.get('http://localhost:3001/api/users/all');
          const usersData = usersResponse.data.data || [];
          
          // PASO 4: Procesar cada usuario - TODOS tendrán TODAS las columnas de documentos
          const processedUsers = await Promise.all(
            usersData.map(async (user) => {
              try {
                // Inicializar TODAS las columnas de documentos como "SIN CARGAR"
                const userDocs = {};
                documentColumns.forEach(columnName => {
                  userDocs[columnName] = {
                    estado: 'Sin cargar',
                    fecha: null
                  };
                });
                
                // Obtener documentos del usuario (si los tiene)
                const userDocsResponse = await axios.get(`http://localhost:3001/api/documents/user/${user.id_usuario}`);
                const userDocuments = userDocsResponse.data || [];
                
                // Mapear solo los documentos que el usuario SÍ tiene cargados
                userDocuments.forEach(doc => {
                  const nombreDoc = doc.nombre_doc;
                  const dosis = parseInt(doc.dosis) || 1;
                  
                  let columnName;
                  if (dosis > 1) {
                    columnName = `${nombreDoc} - Dosis ${dosis}`;
                  } else {
                    columnName = nombreDoc;
                  }
                  
                  // Solo actualizar si la columna existe en nuestras columnas predefinidas
                  if (userDocs.hasOwnProperty(columnName)) {
                    userDocs[columnName] = {
                      estado: doc.estado || 'Sin cargar',
                      fecha: doc.fecha_cargue
                    };
                  }
                });

                return {
                  id: user.id_usuario,
                  nombre: `${user.nombre_usuario} ${user.apellido_usuario}`,
                  cedula: user.documento_usuario,
                  correo: user.correo_usuario,
                  rol: user.rol,
                  documentos: userDocs
                };
              } catch (userError) {
                console.error(`Error fetching documents for user ${user.id_usuario}:`, userError);
                
                // Incluso con error, asegurar que el usuario tenga TODAS las columnas de documentos
                const emptyDocs = {};
                documentColumns.forEach(columnName => {
                  emptyDocs[columnName] = {
                    estado: 'Sin cargar',
                    fecha: null
                  };
                });
                
                return {
                  id: user.id_usuario,
                  nombre: `${user.nombre_usuario} ${user.apellido_usuario}`,
                  cedula: user.documento_usuario,
                  correo: user.correo_usuario,
                  rol: user.rol,
                  documentos: emptyDocs
                };
              }
            })
          );

          setUsers(processedUsers);
          setDocumentos(documentColumns); // TODAS las columnas de la hoja DOCUMENTOS
          setError(null);
          
          console.log(`Procesados ${processedUsers.length} usuarios con ${documentColumns.length} columnas de documentos cada uno`);
          
        } catch (err) {
          console.error('Error fetching data:', err);
          setError('Error al cargar los datos. Verificar que el servidor esté ejecutándose en el puerto 3001.');
          
          // Datos de ejemplo que muestran TODAS las columnas posibles
          const exampleDocumentColumns = [
            'Documento de Identificación',
            'Carné EPS',
            'Hepatitis B - Dosis 1',
            'Hepatitis B - Dosis 2',
            'Hepatitis B - Dosis 3',
            'Tétanos - Dosis 1',
            'Tétanos - Dosis 2',
            'Varicela',
            'Influenza',
            'COVID-19 - Dosis 1',
            'COVID-19 - Dosis 2',
            'COVID-19 - Refuerzo'
          ];
          
          const mockUsers = [
            {
              id: '1',
              nombre: 'Juan Carlos Pérez',
              cedula: '12345678',
              correo: 'juan.perez@ejemplo.com',
              rol: 'estudiante',
              documentos: {
                'Documento de Identificación': { estado: 'Cumplido', fecha: '2024-01-15' },
                'Carné EPS': { estado: 'Cumplido', fecha: '2024-01-16' },
                'Hepatitis B - Dosis 1': { estado: 'Cumplido', fecha: '2024-01-17' },
                'Hepatitis B - Dosis 2': { estado: 'Sin revisar', fecha: '2024-01-18' },
                'Hepatitis B - Dosis 3': { estado: 'Sin cargar', fecha: null },
                'Tétanos - Dosis 1': { estado: 'Cumplido', fecha: '2024-01-19' },
                'Tétanos - Dosis 2': { estado: 'Sin cargar', fecha: null },
                'Varicela': { estado: 'Cumplido', fecha: '2024-01-20' },
                'Influenza': { estado: 'Sin cargar', fecha: null },
                'COVID-19 - Dosis 1': { estado: 'Cumplido', fecha: '2024-01-21' },
                'COVID-19 - Dosis 2': { estado: 'Cumplido', fecha: '2024-01-22' },
                'COVID-19 - Refuerzo': { estado: 'Sin cargar', fecha: null }
              }
            },
            {
              id: '2',
              nombre: 'María García López',
              cedula: '87654321',
              correo: 'maria.garcia@ejemplo.com',
              rol: 'profesor',
              documentos: {
                'Documento de Identificación': { estado: 'Cumplido', fecha: '2024-02-01' },
                'Carné EPS': { estado: 'Cumplido', fecha: '2024-02-02' },
                'Hepatitis B - Dosis 1': { estado: 'Cumplido', fecha: '2024-02-03' },
                'Hepatitis B - Dosis 2': { estado: 'Cumplido', fecha: '2024-02-04' },
                'Hepatitis B - Dosis 3': { estado: 'Cumplido', fecha: '2024-02-05' },
                'Tétanos - Dosis 1': { estado: 'Cumplido', fecha: '2024-02-06' },
                'Tétanos - Dosis 2': { estado: 'Cumplido', fecha: '2024-02-07' },
                'Varicela': { estado: 'Cumplido', fecha: '2024-02-08' },
                'Influenza': { estado: 'Cumplido', fecha: '2024-02-09' },
                'COVID-19 - Dosis 1': { estado: 'Cumplido', fecha: '2024-02-10' },
                'COVID-19 - Dosis 2': { estado: 'Cumplido', fecha: '2024-02-11' },
                'COVID-19 - Refuerzo': { estado: 'Sin cargar', fecha: null }
              }
            }
          ];
          
          setUsers(mockUsers);
          setDocumentos(exampleDocumentColumns);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [open]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleGenerateReport = async (type = 'selected') => {
    try {
      setLoading(true);
      
      const reportData = type === 'selected' 
        ? users.filter(user => selectedUsers.includes(user.id))
        : users;

      // Preparar encabezados de columnas - usar las columnas dinámicas extraídas de la base de datos
      const headers = ['NOMBRE', 'CEDULA', 'CORREO', 'ROL'];
      
      // Agregar todas las columnas de documentos dinámicamente
      documentos.forEach(nombreDoc => {
        headers.push(nombreDoc.toUpperCase());
      });

      // Preparar datos para Excel
      const excelData = [
        // Título y metadatos
        ['REPORTE DE USUARIOS CON DOCUMENTOS', '', '', ''],
        ['Fecha de generación:', new Date().toLocaleDateString(), '', ''],
        ['Tipo de reporte:', reportType === 'all' ? 'Todos los usuarios' : 
                          reportType === 'students' ? 'Solo estudiantes' : 'Solo profesores', '', ''],
        ['Total de usuarios:', reportData.length, '', ''],
        ['Total de columnas de documentos:', documentos.length, '', ''],
        ['', '', '', ''],
        // Encabezados de columnas
        headers,
        // Datos
        ...reportData.map(user => {
          const row = [
            user.nombre,
            user.cedula,
            user.correo,
            user.rol === 'estudiante' ? 'Estudiante' : 'Profesor'
          ];

          // Agregar estados de documentos dinámicamente
          documentos.forEach(nombreDoc => {
            const documento = user.documentos[nombreDoc];
            row.push(formatearEstadoDocumento(documento?.estado, documento?.fecha));
          });

          return row;
        })
      ];

      // Crear un nuevo libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Crear una hoja de cálculo con los datos
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Establecer el ancho de las columnas dinámicamente
      const colWidths = headers.map((header, index) => {
        if (index < 4) return { wch: 25 }; // Columnas básicas
        if (header.includes('HEPATITIS') || header.includes('COVID')) return { wch: 30 };
        if (header.includes('IDENTIFICACIÓN') || header.includes('EPS')) return { wch: 35 };
        return { wch: 25 }; // Ancho por defecto para otras columnas
      });
      ws['!cols'] = colWidths;

      // Agregar estilos a las celdas
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = 0; R <= range.e.r; R++) {
        for (let C = 0; C <= range.e.c; C++) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          
          if (!ws[cell_ref]) continue;

          // Estilo para el título
          if (R === 0) {
            ws[cell_ref].s = {
              font: { bold: true, sz: 14 },
              alignment: { horizontal: 'center' }
            };
          }
          // Estilo para los metadatos
          else if (R >= 1 && R <= 5) {
            ws[cell_ref].s = {
              font: { bold: true },
              alignment: { horizontal: 'left' }
            };
          }
          // Estilo para los encabezados de columna (fila 6, índice 6)
          else if (R === 6) {
            ws[cell_ref].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "B22222" } },
              alignment: { horizontal: 'center', wrapText: true },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            };
          }
          // Estilo para los datos
          else if (R > 6) {
            ws[cell_ref].s = {
              alignment: { horizontal: 'left', wrapText: true },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            };
          }
        }
      }

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Documentos");

      // Generar el archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_documentos_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setError(null);
      alert(`Reporte Excel generado exitosamente con ${reportData.length} usuarios y ${documentos.length} tipos de documentos.`);
      
      onClose();
    } catch (err) {
      setError('Error al generar el reporte');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cedula.includes(searchTerm) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filters.role === 'all' || user.rol === filters.role;
    const matchesDocumentStatus = filters.documentStatus === 'all' || user.documentStatus === filters.documentStatus;

    return matchesSearch && matchesRole && matchesDocumentStatus;
  });

  return (
    <ThemeProvider theme={clinicalTheme}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(178, 34, 34, 0.15)',
            bgcolor: 'background.paper',
          }
        }}
      >
        {/* Header con diseño clínico */}
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 3,
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Generador de Reportes Institucionales
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                Seleccione el tipo de reporte y los usuarios para generar el documento Excel
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            onClick={onClose}
            sx={{ 
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Selector de tipo de reporte */}
          <Paper elevation={0} sx={{ bgcolor: 'secondary.light', borderRadius: 0 }}>
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" fontSize="small" />
                Paso 1: Seleccione el tipo de reporte
              </Typography>
              <Tabs
                value={reportType}
                onChange={(e, newValue) => setReportType(newValue)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 2,
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon />
                      Todos los Usuarios
                    </Box>
                  } 
                  value="all" 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon />
                      Solo Estudiantes
                    </Box>
                  } 
                  value="students" 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon />
                      Solo Profesores
                    </Box>
                  } 
                  value="teachers" 
                />
              </Tabs>
            </Box>
          </Paper>

          <Box sx={{ p: 3 }}>
            {/* Barra de búsqueda mejorada */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" />
              Paso 2: Busque usuarios específicos (opcional)
            </Typography>
            
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Escriba nombre, cédula o correo electrónico para buscar..."
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: searchTerm && (
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item>
                <Tooltip title="Haga clic para mostrar u ocultar filtros adicionales">
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    onClick={() => setShowFilters(!showFilters)}
                    startIcon={<FilterListIcon />}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      px: 3
                    }}
                  >
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Filtros avanzados con mejor diseño */}
            <Fade in={showFilters}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  bgcolor: 'secondary.light',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Filtros Avanzados
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ fontWeight: 500 }}>Tipo de Usuario</InputLabel>
                      <Select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        label="Tipo de Usuario"
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon fontSize="small" />
                            Todos los usuarios
                          </Box>
                        </MenuItem>
                        <MenuItem value="estudiante">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            Solo estudiantes
                          </Box>
                        </MenuItem>
                        <MenuItem value="profesor">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon fontSize="small" />
                            Solo profesores
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ fontWeight: 500 }}>Estado de Documentos</InputLabel>
                      <Select
                        value={filters.documentStatus}
                        onChange={(e) => handleFilterChange('documentStatus', e.target.value)}
                        label="Estado de Documentos"
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <MenuItem value="all">Todos los estados</MenuItem>
                        <MenuItem value="pending">
                          <Chip label="Pendientes" color="warning" size="small" sx={{ mr: 1 }} />
                          Documentos pendientes
                        </MenuItem>
                        <MenuItem value="approved">
                          <Chip label="Aprobados" color="success" size="small" sx={{ mr: 1 }} />
                          Documentos aprobados
                        </MenuItem>
                        <MenuItem value="rejected">
                          <Chip label="Rechazados" color="error" size="small" sx={{ mr: 1 }} />
                          Documentos rechazados
                        </MenuItem>
                        <MenuItem value="expired">
                          <Chip label="Vencidos" color="error" size="small" sx={{ mr: 1 }} />
                          Documentos vencidos
                        </MenuItem>
                        <MenuItem value="not_uploaded">
                          <Chip label="Sin cargar" color="default" size="small" sx={{ mr: 1 }} />
                          Sin documentos
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ fontWeight: 500 }}>Período de Tiempo</InputLabel>
                      <Select
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        label="Período de Tiempo"
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <MenuItem value="all">Todo el historial</MenuItem>
                        <MenuItem value="lastWeek">Última semana</MenuItem>
                        <MenuItem value="lastMonth">Último mes</MenuItem>
                        <MenuItem value="lastYear">Último año</MenuItem>
                        <MenuItem value="thisSemester">Semestre actual</MenuItem>
                        <MenuItem value="lastSemester">Semestre anterior</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Fade>

            <Divider sx={{ my: 3 }} />

            {/* Área de resultados */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon color="primary" />
              Paso 3: Seleccione usuarios para el reporte
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} thickness={4} />
              </Box>
            ) : (
              <>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    bgcolor: 'secondary.light',
                    borderRadius: 2,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    <strong>{filteredUsers.length}</strong> usuarios encontrados
                    {selectedUsers.length > 0 && (
                      <span> • <strong>{selectedUsers.length}</strong> seleccionados</span>
                    )}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAll}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </Button>
                </Paper>

                <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {filteredUsers.map((user, index) => (
                      <ListItem 
                        key={user.id} 
                        sx={{ 
                          py: 2,
                          borderBottom: index < filteredUsers.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {user.nombre}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Cédula:</strong> {user.cedula}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Correo:</strong> {user.correo}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Marque para incluir en el reporte">
                            <Checkbox
                              edge="end"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserSelect(user.id)}
                              size="large"
                              sx={{
                                '&.Mui-checked': {
                                  color: 'primary.main',
                                }
                              }}
                            />
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </>
            )}
          </Box>
        </DialogContent>

        {/* Botones de acción mejorados */}
        <DialogActions sx={{ p: 3, bgcolor: 'secondary.light', gap: 2 }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            size="large"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            Cancelar
          </Button>
          
          <Tooltip title="Genera un reporte Excel solo con los usuarios que ha seleccionado">
            <span>
              <Button
                onClick={() => handleGenerateReport('selected')}
                variant="contained"
                color="primary"
                disabled={selectedUsers.length === 0 || loading}
                startIcon={<DownloadIcon />}
                size="large"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(178, 34, 34, 0.3)'
                }}
              >
                {loading ? 'Generando...' : `Exportar Seleccionados (${selectedUsers.length})`}
              </Button>
            </span>
          </Tooltip>
          
          <Tooltip title="Genera un reporte Excel con todos los usuarios que aparecen en la lista filtrada">
            <Button
              onClick={() => handleGenerateReport('all')}
              variant="contained"
              color="secondary"
              disabled={loading}
              startIcon={<DownloadIcon />}
              size="large"
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                color: 'primary.main',
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              {loading ? 'Generando...' : `Exportar Todos (${filteredUsers.length})`}
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default ReportGeneratorModal; 