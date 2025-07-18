import React from 'react';
import {
  Box,
  Typography,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Warning,
  CloudOff
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const DocumentStats = ({ documentStats, statusFilter, onStatusFilterClick }) => {
  const stats = [
    {
      key: 'Aprobados',
      count: documentStats.aprobados,
      icon: CheckCircle,
      color: 'success',
      filter: 'Aprobados'
    },
    {
      key: 'Pendientes',
      count: documentStats.pendientes,
      icon: HourglassEmpty,
      color: 'info',
      filter: 'Pendientes'
    },
    {
      key: 'Rechazados',
      count: documentStats.rechazados,
      icon: Cancel,
      color: 'error',
      filter: 'Rechazados'
    },
    {
      key: 'Vencidos',
      count: documentStats.vencidos,
      icon: Warning,
      color: 'warning',
      filter: 'Vencidos'
    },
    {
      key: 'Sin cargar',
      count: documentStats.sinCargar,
      icon: CloudOff,
      color: 'default',
      filter: 'Sin cargar'
    }
  ];

  return (
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
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        const isSelected = statusFilter === stat.filter;
        const color = stat.color;
        
        return (
          <Box
            key={stat.key}
            onClick={() => onStatusFilterClick(stat.filter)}
            sx={{
              px: 2,
              py: 1.2,
              minWidth: 110,
              borderRadius: 3,
              bgcolor: isSelected ? `${color}.main` : `${color}.light`,
              color: isSelected ? 'white' : `${color}.main`,
              boxShadow: isSelected 
                ? `0 4px 20px ${alpha(stat.color === 'default' ? '#616161' : stat.color === 'success' ? '#4caf50' : stat.color === 'info' ? '#2196f3' : stat.color === 'error' ? '#f44336' : '#ff9800', 0.3)}`
                : `0 2px 12px 0 ${alpha(stat.color === 'default' ? '#616161' : stat.color === 'success' ? '#4caf50' : stat.color === 'info' ? '#2196f3' : stat.color === 'error' ? '#f44336' : '#ff9800', 0.07)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.04)',
                boxShadow: `0 4px 18px 0 ${alpha(stat.color === 'default' ? '#616161' : stat.color === 'success' ? '#4caf50' : stat.color === 'info' ? '#2196f3' : stat.color === 'error' ? '#f44336' : '#ff9800', 0.13)}`
              }
            }}
          >
            <IconComponent 
              sx={{ 
                color: isSelected ? 'white' : `${color}.main`, 
                fontSize: 28 
              }} 
            />
            <Box>
              <Typography 
                variant="h5" 
                fontWeight={700} 
                lineHeight={1.1} 
                sx={{ 
                  color: isSelected ? 'white' : `${color}.main` 
                }}
              >
                {stat.count}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isSelected ? 'rgba(255,255,255,0.9)' : `${color}.dark`, 
                  fontWeight: 500, 
                  textTransform: 'uppercase', 
                  letterSpacing: 0.5 
                }}
              >
                {stat.key}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

export default DocumentStats; 