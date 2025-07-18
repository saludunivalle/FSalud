import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import {
  Search,
  Cancel
} from '@mui/icons-material';

const DocumentFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  clearAllFilters
}) => {
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Indicadores de filtros activos */}
      {(statusFilter !== 'Todos' || searchTerm !== '') && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Filtros activos:
            </Typography>
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
        </Stack>
      )}
      
      {/* Barra de búsqueda */}
      <TextField
        fullWidth
        placeholder="Buscar documentos por nombre o comentarios..."
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
        sx={{ mb: 2 }}
      />
    </Box>
  );
};

export default DocumentFilters; 