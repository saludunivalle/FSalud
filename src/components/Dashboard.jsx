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
  IconButton, // Added
  Tooltip, // Added
  TextField, // Added
  InputAdornment // Added
} from '@mui/material';
import { Upload, CheckCircle, Cancel, Visibility, Search, Warning, HourglassEmpty, Block, CloudOff } from '@mui/icons-material'; // Added Visibility, Search
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useUser } from '../context/UserContext'; // Added useUser
import { useDocuments } from '../context/DocumentContext'; // Added useDocuments
import { useNavigate } from 'react-router-dom'; // Added useNavigate

// Tema personalizado (mantener el existente)
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222',
    },
    secondary: {
      main: '#1976d2',
    },
    success: { // Renamed from approved
      light: '#e8f5e9',
      main: '#4caf50', // Use main color for consistency
    },
    error: { // Renamed from rejected
      light: '#ffebee',
      main: '#f44336', // Use main color for consistency
    },
    warning: { // Added for expired/pending
      light: '#fff3e0',
      main: '#ff9800',
    },
    info: { // Added for pending/sin revisar
      light: '#e3f2fd',
      main: '#2196f3',
    },
    default: { // Added for 'sin cargar'
        light: '#f5f5f5',
        main: '#9e9e9e',
    }
  },
});

// Componente para el chip de estado (similar a DocumentHistory)
const StatusChip = ({ status }) => {
  let icon, color, label;

  switch (status?.toLowerCase()) {
    case 'cumplido':
    case 'aprobado': // Assuming backend uses 'Cumplido' but frontend shows 'Aprobado'
      icon = <CheckCircle />;
      color = 'success';
      label = 'Aprobado';
      break;
    case 'rechazado':
      icon = <Cancel />; // Changed icon for consistency
      color = 'error';
      label = 'Rechazado';
      break;
    case 'expirado':
    case 'vencido': // Allow both terms
      icon = <Warning />;
      color = 'warning';
      label = 'Vencido';
      break;
    case 'sin revisar': // Map backend 'Sin revisar'
    case 'pendiente': // Allow both terms
      icon = <HourglassEmpty />;
      color = 'info';
      label = 'Pendiente';
      break;
    case 'no aplica':
        icon = <Block />; // Example icon, choose appropriate one
        color = 'default';
        label = 'No Aplica';
        break;
    case 'sin cargar':
    default:
      icon = <CloudOff />; // Example icon
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
      sx={{ minWidth: '110px' }} // Ensure consistent width
    />
  );
};

const Dashboard = () => {
  const { user } = useUser(); // Get user data
  // Destructure isDocumentExpired if needed later for vencimiento column
  const { userDocuments, documentTypes, loading: documentsLoading } = useDocuments(); // Use context
  const navigate = useNavigate(); // For navigation

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedDocuments, setCombinedDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  // Combine documentTypes with userDocuments
  useEffect(() => {
    // Add checks for both arrays before proceeding
    if (documentTypes && documentTypes.length > 0 && userDocuments) {
      const combined = documentTypes.map(docType => {
        // userDocuments is already checked above, so .find is safe
        const userDoc = userDocuments.find(ud => ud.id_doc === docType.id_doc);
        // Determine status - map backend 'Sin revisar' to 'Pendiente' for consistency
        let status = 'Sin cargar';
        if (userDoc) {
            status = userDoc.estado || 'Pendiente'; // Default to Pendiente if null/empty
            if (status.toLowerCase() === 'sin revisar') {
                status = 'Pendiente';
            }
            // Add check for expiration if needed for the status chip itself
            // if (status.toLowerCase() === 'aprobado' || status.toLowerCase() === 'cumplido') {
            //    const expires = docType.vence === 'si';
            //    // Need fecha_vencimiento on userDoc for accurate check
            //    // if (expires && userDoc.fecha_vencimiento && new Date(userDoc.fecha_vencimiento) < new Date()) {
            //    //    status = 'Vencido';
            //    // }
            // }
        }

        return {
          id_doc: docType.id_doc,
          name: docType.nombre_doc,
          vence: docType.vence === 'si', // Convert to boolean
          tiempo_vencimiento: docType.tiempo_vencimiento, // Keep this if needed for calculations
          userDocData: userDoc || null, // Store the user document data or null
          status: status, // Use the determined status
          // Add specific dates if available in userDocData, otherwise null
          fecha_expedicion: userDoc?.fecha_expedicion || null, // Assuming backend provides this
          fecha_vencimiento: userDoc?.fecha_vencimiento || null, // Assuming backend provides this
        };
      });
      setCombinedDocuments(combined);
    } else {
        setCombinedDocuments([]);
    }
  }, [documentTypes, userDocuments]);

  // Filter documents based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDocuments(combinedDocuments);
    } else {
      const filtered = combinedDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
    setPage(0); // Reset page when search term changes
  }, [searchTerm, combinedDocuments]);


  // Formato de fecha (mantener el existente)
  const formatDate = (date) => {
    if (!date) return '—';
    // Ensure date is parsed correctly, backend might send strings
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '—'; // Return dash for invalid dates too
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

  // Navigate to the uploader page, passing the document type ID
  const handleUpload = (documentTypeId) => {
    // You might want to pass the document name as state too for better UX in the uploader
    const docType = documentTypes.find(dt => dt.id_doc === documentTypeId);
    navigate('/upload-document', { state: { documentId: documentTypeId, documentName: docType?.nombre_doc } });
  };

  // Determine row background color based on status
   const getRowBackground = (status) => {
    switch (status?.toLowerCase()) {
      case 'cumplido':
      case 'aprobado':
        return theme.palette.success.light;
      case 'rechazado':
        return theme.palette.error.light;
      case 'expirado':
      case 'vencido':
        return theme.palette.warning.light;
      case 'sin revisar':
      case 'pendiente':
        return theme.palette.info.light;
       case 'no aplica':
       case 'sin cargar':
      default:
        return 'inherit'; // Or theme.palette.default.light for 'sin cargar'/'no aplica'
    }
  };


  if (documentsLoading) { // Use loading state from context
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

           {/* Barra de búsqueda */}
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
                    {/* Updated Headers based on request */}
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 180 }}>Documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 150 }}>Cargue los documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 130 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha cargue</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha de expedición</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha de vencimiento</TableCell>
                    {/* 'Aprobado' column removed as it's part of 'Estado' */}
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 110 }}>Fecha Revisión</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 80 }}>Ver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                     <TableRow>
                       {/* Adjusted colSpan to match new number of columns */}
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
                        key={doc.id_doc} // Use document type ID as key
                        sx={{ backgroundColor: getRowBackground(doc.status) }}
                      >
                        {/* Documentos */}
                        <TableCell>{doc.name}</TableCell>
                        {/* Cargue los documentos */}
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Upload />}
                            size="small"
                            onClick={() => handleUpload(doc.id_doc)}
                            sx={{
                              minWidth: '120px', // Adjusted width
                              px: 1.5, // Adjusted padding
                              py: 0.7
                            }}
                          >
                            {doc.userDocData ? 'Actualizar' : 'Cargar'}
                          </Button>
                        </TableCell>
                        {/* Estado */}
                        <TableCell>
                          <StatusChip status={doc.status} />
                        </TableCell>
                        {/* Fecha cargue */}
                        <TableCell>{formatDate(doc.userDocData?.fecha_cargue)}</TableCell>
                        {/* Fecha de expedición - Placeholder, requires backend data */}
                        <TableCell>{formatDate(doc.fecha_expedicion)}</TableCell>
                        {/* Fecha de vencimiento - Placeholder, requires backend data */}
                        <TableCell>{formatDate(doc.fecha_vencimiento)}</TableCell>
                        {/* Fecha Revisión */}
                        <TableCell>{formatDate(doc.userDocData?.fecha_revision)}</TableCell>
                        {/* Ver */}
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
                            '—' // Show dash if no file path
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                   )}
                </TableBody>
              </Table>
            </TableContainer>
            {/* ... TablePagination ... */}
             <TablePagination
               rowsPerPageOptions={[10, 25, 50]}
               component="div"
               count={filteredDocuments.length} // Use filtered length for count
               rowsPerPage={rowsPerPage}
               page={page}
               onPageChange={handleChangePage}
               onRowsPerPageChange={handleChangeRowsPerPage}
               labelRowsPerPage="Filas por página:"
               labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
             />
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;