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
  CircularProgress
} from '@mui/material';
import { Upload, CheckCircle, Cancel } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Lista de documentos (normalmente se cargaría desde una API)
const documentList = [
  "Anticuerpos de Hepatitis_B",
  "Anticuerpos de Varicela",
  "COVID-19_Dosis_1",
  "COVID-19_Dosis_2",
  "Capacitación Control de Infecciones",
  "Capacitación Historia Clínica",
  "Capacitación Humanización de la Atención",
  "Capacitación Seguridad del Paciente",
  "Capacitación en DARUMA",
  "Certificación de ARL",
  "Certificado de Curso RCP o Soporte Vital",
  "Certificado de EPS (ADRES)",
  "Certificado de vinculación laboral",
  "DPTa",
  "Diploma de posgrado en docencia/pedagogía o certificación de experiencia docente (mín. tres años)",
  "Diploma o Título Profesional",
  "Documento de identificación (TI, CC, CE, Visa)",
  "Hep_A_Dosis_1",
  "Hep_A_Dosis_2",
  "Hep_B_Dosis_1",
  "Hep_B_Dosis_2",
  "Hep_B_Dosis_3",
  "Hoja de vida",
  "Inducción Institucional",
  "Inducción Institucional (General)",
  "Influenza",
  "Prueba PPD",
  "Póliza de responsabilidad civil",
  "Registro ReTHUS",
  "Tetano_Dosis_1",
  "Tetano_Dosis_2",
  "Tetano_Dosis_3",
  "Triple_Viral_MMR",
  "Var_Dosis_1",
  "Var_Dosis_2"
];

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#B22222', // Color rojo sangre toro (Universidad del Valle)
    },
    secondary: {
      main: '#1976d2',
    },
    approved: {
      light: '#e8f5e9', // Light green background for approved documents
      main: '#81c784',
    },
    rejected: {
      light: '#ffebee', // Light red background for rejected documents
      main: '#ef9a9a',
    }
  },
});

const Dashboard = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [documents, setDocuments] = useState([]);

  // Simulamos la carga de datos
  useEffect(() => {
    // Crear datos de ejemplo para los documentos
    const mockDocuments = documentList.map((doc, index) => {
      // Generamos datos aleatorios para simular el estado de los documentos
      const isUploaded = Math.random() > 0.5;
      const isApproved = isUploaded ? Math.random() > 0.3 : false;
      
      // Fechas aleatorias para simular el proceso
      const today = new Date();
      const uploadDate = isUploaded ? new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
      const expeditionDate = isUploaded ? new Date(uploadDate.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000) : null;
      const expirationDate = expeditionDate ? new Date(expeditionDate.getTime() + (365 + Math.floor(Math.random() * 365)) * 24 * 60 * 60 * 1000) : null;
      const reviewDate = isApproved ? new Date(uploadDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null;
      
      return {
        id: index + 1,
        name: doc,
        uploaded: isUploaded,
        uploadDate: uploadDate,
        expeditionDate: expeditionDate,
        expirationDate: expirationDate,
        approved: isApproved,
        reviewDate: reviewDate
      };
    });
    
    setDocuments(mockDocuments);
    setLoading(false);
  }, []);

  // Formato de fecha
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
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

  const handleUpload = (documentId) => {
    alert(`Función para cargar documento ${documentId} (se implementará en próximas versiones)`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl">
        <Box sx={{ padding: 3, marginTop: 12 }}>
          <Typography variant="h5" gutterBottom>
            Bienvenido, {userData?.name || 'Usuario'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Por favor cargar cada documento en donde corresponde
          </Typography>
          
          <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
            <TableContainer sx={{ maxHeight: 540 }}>
              <Table stickyHeader aria-label="tabla de documentos">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cargue los documentos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha cargue</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha de expedición</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha de vencimiento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Aprobado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha Revisión</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doc) => (
                    <TableRow 
                      hover 
                      key={doc.id}
                      sx={{ 
                        backgroundColor: doc.uploaded ? 
                          (doc.approved ? theme.palette.approved.light : theme.palette.rejected.light) : 
                          'inherit' 
                      }}
                    >
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Upload />}
                          size="small"
                          onClick={() => handleUpload(doc.id)}
                          sx={{ 
                            minWidth: '140px',
                            px: 2,
                            py: 0.7
                          }}
                        >
                          {doc.uploaded ? 'Actualizar' : 'Cargar'}
                        </Button>
                      </TableCell>
                      <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                      <TableCell>{formatDate(doc.expeditionDate)}</TableCell>
                      <TableCell>{formatDate(doc.expirationDate)}</TableCell>
                      <TableCell>
                        {doc.uploaded ? (
                          doc.approved ? (
                            <Chip 
                              icon={<CheckCircle />} 
                              label="Sí" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              icon={<Cancel />} 
                              label="No" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(doc.reviewDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={documents.length}
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