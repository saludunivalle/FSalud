import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Alert
} from '@mui/material';
import { 
  Person, 
  CalendarToday, 
  Email, 
  School, 
  Phone,
  Badge
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { updateUserData } from '../../services/userService';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

// Estilos personalizados para mejorar la apariencia
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  maxWidth: 620, // Reducido de 800px
  width: '100%',
  margin: '0 auto',
  marginTop: theme.spacing(2), // Reducido para dejar más espacio para el título
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#B22222',
  color: 'white',
  padding: '8px 16px', // Reducido el padding
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  '&:hover': {
    backgroundColor: '#8B0000',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover fieldset': {
      borderColor: 'rgba(0,0,0,0.3)',
    },
  },
  // Hacer los inputs más compactos
  '& .MuiInputBase-root': {
    height: '45px', // Altura más reducida
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 12px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)',
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  height: '45px', // Ajustando altura igual que TextField
}));

const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 120px)', // Asegura espacio para el título
  width: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    minHeight: 'calc(100vh - 100px)',
  }
}));

const FirstLoginForm = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    phone: '',
    personalEmail: '',
    role: 'estudiante', // Valor predeterminado
    birthDate: '',
    program: ''
  });
  const [errors, setErrors] = useState({});
  const [showEmailAlert, setShowEmailAlert] = useState(true);

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

    // Si cambia el correo, mostrar el aviso
    if (name === 'personalEmail') {
      setShowEmailAlert(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar nombre y apellido
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    
    // Validar documento
    if (!formData.documentType) newErrors.documentType = 'El tipo de documento es requerido';
    if (!formData.documentNumber) newErrors.documentNumber = 'El número de documento es requerido';
    else if (!/^\d+$/.test(formData.documentNumber)) newErrors.documentNumber = 'Solo se permiten números';
    
    // Validar teléfono
    if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Debe ser un número de 10 dígitos';
    
    // Validar correo personal
    if (!formData.personalEmail) newErrors.personalEmail = 'El correo personal es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) newErrors.personalEmail = 'Correo electrónico inválido';
    else if (formData.personalEmail.endsWith('@correounivalle.edu.co')) {
      newErrors.personalEmail = 'No puede ser el mismo correo institucional';
    }
    
    // Validar fecha de nacimiento
    if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
    else {
      const birthDate = new Date(formData.birthDate);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.birthDate = 'La edad debe estar entre 16 y 100 años';
      }
    }
    
    // Validar programa académico
    if (!formData.program) newErrors.program = 'El programa académico es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create the user data object with all required fields
      const userData = {
        programa_academico: formData.program,
        documento_usuario: formData.documentNumber,
        tipoDoc: formData.documentType,
        telefono: formData.phone,
        fecha_nac: formData.birthDate,
        email: formData.personalEmail, 
        correo_usuario: user.email,
        nombre_usuario: formData.firstName,
        apellido_usuario: formData.lastName,
        rol: formData.role,
        primer_login: "si"
      };
      
      console.log("Submitting user data:", userData);
      const response = await updateUserData(user.id, userData);
      console.log("Server response:", response);
      
      // Update the local user state
      setUser(prev => ({
        ...prev,
        ...userData,
        name: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        isFirstLogin: false
      }));
      
      // Update local storage
      localStorage.setItem('isFirstLogin', 'false');
      localStorage.setItem('user_role', formData.role);
      localStorage.setItem('name', `${formData.firstName} ${formData.lastName}`);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating data:', error);
      alert('There was an error saving your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500, color: '#B22222' }}>
          Completa tu perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Para continuar, necesitamos algunos datos adicionales.
        </Typography>
      </Box>

      <StyledPaper elevation={3}>
        {showEmailAlert && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }} 
            onClose={() => setShowEmailAlert(false)}
          >
            Por favor ingresa el correo con el que deseas seguir iniciando sesión.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {/* Nombre y Apellido */}
            <Grid item xs={12} sm={6}>
              <StyledTextField
                name="firstName"
                label="Nombre"
                fullWidth
                required
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                name="lastName"
                label="Apellido"
                fullWidth
                required
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Tipo y número de documento */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.documentType} required size="small">
                <InputLabel id="document-type-label">Tipo de documento</InputLabel>
                <StyledSelect
                  labelId="document-type-label"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  label="Tipo de documento"
                  startAdornment={
                    <InputAdornment position="start">
                      <Badge fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  {documentTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </StyledSelect>
                {errors.documentType && (
                  <Typography variant="caption" color="error">
                    {errors.documentType}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                name="documentNumber"
                label="Número de documento"
                fullWidth
                required
                value={formData.documentNumber}
                onChange={handleChange}
                error={!!errors.documentNumber}
                helperText={errors.documentNumber}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Email personal */}
            <Grid item xs={12} sm={6}>
              <StyledTextField
                name="personalEmail"
                label="Correo personal"
                type="email"
                fullWidth
                required
                value={formData.personalEmail}
                onChange={handleChange}
                error={!!errors.personalEmail}
                helperText={errors.personalEmail}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12} sm={6}>
              <StyledTextField
                name="phone"
                label="Teléfono celular"
                fullWidth
                required
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Radio Button para rol */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                ¿Eres estudiante o profesor?
              </Typography>
              <RadioGroup
                row
                name="role"
                value={formData.role}
                onChange={handleChange}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="estudiante" 
                  control={<Radio size="small" sx={{
                    '&.Mui-checked': {
                      color: '#B22222',
                    }
                  }}/>} 
                  label="Estudiante" 
                />
                <FormControlLabel 
                  value="profesor" 
                  control={<Radio size="small" sx={{
                    '&.Mui-checked': {
                      color: '#B22222',
                    }
                  }}/>} 
                  label="Profesor" 
                />
              </RadioGroup>
            </Grid>

            {/* Fecha de nacimiento */}
            <Grid item xs={12} sm={6}>
              <StyledTextField
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Programa académico */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.program} required size="small">
                <InputLabel id="program-label">Programa académico</InputLabel>
                <StyledSelect
                  labelId="program-label"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  label="Programa académico"
                  startAdornment={
                    <InputAdornment position="start">
                      <School fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  {programs.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </StyledSelect>
                {errors.program && (
                  <Typography variant="caption" color="error">
                    {errors.program}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <StyledButton
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={18} color="inherit" />}
                >
                  {loading ? 'Guardando...' : 'Guardar y continuar'}
                </StyledButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </StyledPaper>
    </FormContainer>
  );
};

export default FirstLoginForm;