import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
  HourglassEmpty,
  CloudOff
} from '@mui/icons-material';

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

export default StatusChip; 