import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  WhatsApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StudentHeader = ({ student }) => {
  const navigate = useNavigate();

  if (!student) return null;

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
      <IconButton
        size="small"
        onClick={() => navigate('/dashboard')}
        sx={{ 
          color: 'primary.main', 
          borderRadius: 1.5,
          bgcolor: 'primary.light',
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white'
          } 
        }}
      >
        <ArrowBack />
      </IconButton>
      
      <Box flexGrow={1}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              width: 32,
              height: 32,
              fontSize: '1rem'
            }}
          >
            {student.nombre.charAt(0)}{student.apellido.charAt(0)}
          </Avatar>
          {student.nombre} {student.apellido}
          <Chip 
            label={student.rol}
            color={student.rol === 'Docente' ? "primary" : "secondary"}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {student.codigo} · {student.programa} · {student.sede}
          {student.celular && (
            <>
              · {student.celular}
              <IconButton 
                size="small" 
                component="a" 
                href={`https://wa.me/${student.celular.replace(/\s+/g, '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Chat with ${student.nombre} on WhatsApp`}
                sx={{ 
                  color: 'success.main', 
                  ml: 0.5,
                  '&:hover': {
                    bgcolor: 'success.light'
                  }
                }}
              >
                <WhatsApp fontSize="small" />
              </IconButton>
            </>
          )}
        </Typography>
      </Box>
    </Stack>
  );
};

export default StudentHeader; 