// src/components/auth/FirstLoginForm.jsx
import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { updateUserData } from '../../services/userService';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const FirstLoginForm = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    documentNumber: '',
    phone: '',
    address: '',
    birthDate: '',
    personalEmail: '',
    program: ''
  });
  const [errors, setErrors] = useState({});

  // Opciones para el tipo de documento
  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PAS', label: 'Pasaporte' }
  ];

  // Opciones para el programa académico
  const programs = [
    { value: 'MEDICINA', label: 'Medicina' },
    { value: 'ENFERMERIA', label: 'Enfermería' },
    { value: 'ODONTOLOGIA', label: 'Odontología' },
    { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
    { value: 'FONOAUDIOLOGIA', label: 'Fonoaudiología' },
    { value: 'TERAPIA_OCUPACIONAL', label: 'Terapia Ocupacional' },
    { value: 'BACTERIOLOGIA', label: 'Bacteriología' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al cambiar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.documentType) newErrors.documentType = 'El tipo de documento es requerido';
    if (!formData.documentNumber) newErrors.documentNumber = 'El número de documento es requerido';
    else if (!/^\d+$/.test(formData.documentNumber)) newErrors.documentNumber = 'Solo se permiten números';
    
    if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Debe ser un número de 10 dígitos';
    
    if (!formData.address) newErrors.address = 'La dirección es requerida';
    
    if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
    else {
      const birthDate = new Date(formData.birthDate);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.birthDate = 'La edad debe estar entre 16 y 100 años';
      }
    }
    
    if (!formData.personalEmail) newErrors.personalEmail = 'El correo personal es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) newErrors.personalEmail = 'Correo electrónico inválido';
    else if (formData.personalEmail.endsWith('@correounivalle.edu.co')) {
      newErrors.personalEmail = 'No puede ser el mismo correo institucional';
    }
    
    if (!formData.program) newErrors.program = 'El programa académico es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Enviar datos al servidor
      const userData = {
        ...formData,
        isFirstLogin: false
      };
      
      const response = await updateUserData(user.id, userData);
      
      // Actualizar el estado del usuario con la nueva información
      setUser(prev => ({
        ...prev,
        ...userData,
        isFirstLogin: false
      }));
      
      // Guardar en localStorage la bandera de primer inicio de sesión
      localStorage.setItem('isFirstLogin', 'false');
      
      // Redireccionar al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      alert('Ha ocurrido un error al guardar tus datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '80vh',
        padding: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          width: '100%', 
          maxWidth: 600,
          mt: 12
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Completa tu información
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Para continuar, necesitamos algunos datos adicionales para tu perfil.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.documentType} required>
                <InputLabel id="document-type-label">Tipo de documento</InputLabel>
                <Select
                  labelId="document-type-label"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  label="Tipo de documento"
                >
                  {documentTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.documentType && (
                  <Typography variant="caption" color="error">
                    {errors.documentType}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="documentNumber"
                label="Número de documento"
                fullWidth
                required
                value={formData.documentNumber}
                onChange={handleChange}
                error={!!errors.documentNumber}
                helperText={errors.documentNumber}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phone"
                label="Teléfono celular"
                fullWidth
                required
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Dirección"
                fullWidth
                required
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="birthDate"
                label="Fecha de nacimiento"
                type="date"
                fullWidth
                required
                value={formData.birthDate}
                onChange={handleChange}
                error={!!errors.birthDate}
                helperText={errors.birthDate || ' '}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="personalEmail"
                label="Correo personal"
                type="email"
                fullWidth
                required
                value={formData.personalEmail}
                onChange={handleChange}
                error={!!errors.personalEmail}
                helperText={errors.personalEmail}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.program} required>
                <InputLabel id="program-label">Programa académico</InputLabel>
                <Select
                  labelId="program-label"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  label="Programa académico"
                >
                  {programs.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.program && (
                  <Typography variant="caption" color="error">
                    {errors.program}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 2, 
                  backgroundColor: '#B22222',
                  '&:hover': {
                    backgroundColor: '#8B0000',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Guardar y continuar'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default FirstLoginForm;