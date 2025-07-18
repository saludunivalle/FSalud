import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import DocumentRow from './DocumentRow';
import DoseGroupAccordion from './DoseGroupAccordion';

const DocumentTable = ({
  filteredDocuments,
  student,
  formatDate,
  getRowBackground,
  getButtonColor,
  handleOpenModal,
  handleOpenUploadModal,
  theme
}) => {
  return (
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
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', minWidth: 180 }}>Documento</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', minWidth: 90, textAlign: 'center' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', minWidth: 110 }}>Expedición</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', minWidth: 110 }}>Vencimiento</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Comentarios</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', width: 50, p: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }} align="center">Ver</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', width: 50, p: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }} align="center">Editar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', width: 50, p: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }} align="center">Cargar</TableCell>
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
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <DoseGroupAccordion
                        doc={doc}
                        formatDate={formatDate}
                        getRowBackground={getRowBackground}
                        getButtonColor={getButtonColor}
                        handleOpenModal={handleOpenModal}
                        handleOpenUploadModal={handleOpenUploadModal}
                        theme={theme}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  // Renderizar documento normal
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    formatDate={formatDate}
                    getRowBackground={getRowBackground}
                    getButtonColor={getButtonColor}
                    handleOpenModal={handleOpenModal}
                    handleOpenUploadModal={handleOpenUploadModal}
                  />
                )
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DocumentTable; 