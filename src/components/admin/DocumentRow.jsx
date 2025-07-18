import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  Edit,
  CloudUpload
} from '@mui/icons-material';
import StatusChip from './StatusChip';

const DocumentRow = ({
  doc,
  formatDate,
  getRowBackground,
  getButtonColor,
  handleOpenModal,
  handleOpenUploadModal
}) => {
  return (
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
      <TableCell align="center">
        <StatusChip status={doc.estado} />
      </TableCell>
      <TableCell>{formatDate(doc.fechaExpedicion)}</TableCell>
      <TableCell>
        {doc.vence ? formatDate(doc.fechaVencimiento) : 'No vence'}
      </TableCell>
      <TableCell sx={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {doc.comentarios ? (
          <Tooltip title={doc.comentarios}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 120,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.85rem'
              }}
            >
              {doc.comentarios}
            </Typography>
          </Tooltip>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell align="center" sx={{ p: 0.5, whiteSpace: 'nowrap' }}>
        {doc.rutaArchivo && (
          <Tooltip title="Ver documento">
            <IconButton
              size="small"
              component="a"
              href={doc.rutaArchivo}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ bgcolor: 'primary.light', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' }, m: 0.1 }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
      <TableCell align="center" sx={{ p: 0.5, whiteSpace: 'nowrap' }}>
        {doc.rutaArchivo && doc.estado !== 'aprobado' && (
          <Tooltip title="Actualizar documento">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleOpenUploadModal({
                id: doc.id_tipo_documento || doc.id,
                nombre: doc.nombre,
                vence: doc.vence,
                tiempo_vencimiento: doc.tiempo_vencimiento || doc.tiempoVencimiento,
                existingDoc: {
                  fecha_expedicion: doc.fechaExpedicion,
                  fecha_vencimiento: doc.fechaVencimiento,
                  fecha_cargue: doc.fechaCargue,
                  ruta_archivo: doc.rutaArchivo
                }
              })}
              sx={{ bgcolor: 'warning.light', color: 'warning.main', '&:hover': { bgcolor: 'warning.main', color: 'white' }, m: 0.1 }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
      <TableCell align="center" sx={{ p: 0.5, whiteSpace: 'nowrap' }}>
        {doc.estado === 'sin cargar' && (
          <Tooltip title="Cargar documento para este usuario">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleOpenUploadModal({
                id: doc.id_tipo_documento || doc.id,
                nombre: doc.nombre,
                vence: doc.vence,
                tiempo_vencimiento: doc.tiempo_vencimiento || doc.tiempoVencimiento
              })}
              sx={{ bgcolor: 'success.light', color: 'success.main', '&:hover': { bgcolor: 'success.main', color: 'white' }, m: 0.1 }}
            >
              <CloudUpload fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow; 