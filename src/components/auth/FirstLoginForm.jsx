import React, { useState, useEffect } from 'react';
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
  Alert,
  Autocomplete
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
import { getAllPrograms } from '../../services/programsService';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

// Estilos personalizados para mejorar la apariencia
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  maxWidth: 900, // Aumentado para pantallas más grandes
  width: '100%',
  margin: '0 auto',
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('lg')]: {
    maxWidth: 750,
    padding: theme.spacing(3),
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 600,
    padding: theme.spacing(3),
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '95%',
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#B22222',
  color: 'white',
  padding: '12px 24px', // Aumentado el padding para mejor apariencia
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  minHeight: '48px', // Altura mínima para mejor clickeabilidad
  '&:hover': {
    backgroundColor: '#8B0000',
  },
  '&:disabled': {
    backgroundColor: 'rgba(178, 34, 34, 0.5)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover fieldset': {
      borderColor: 'rgba(0,0,0,0.3)',
    },
  },
  // Hacer los inputs más espaciosos
  '& .MuiInputBase-root': {
    height: '52px', // Altura aumentada para mejor visibilidad
    fontSize: '0.95rem', // Tamaño de fuente ligeramente más grande
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 15px) scale(1)',
    fontSize: '0.95rem',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)',
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.8rem',
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  height: '52px', // Ajustando altura igual que TextField
  fontSize: '0.95rem', // Consistencia en el tamaño de fuente
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
  const [programsLoading, setProgramsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    phone: '',
    personalEmail: '',
    role: 'estudiante', // Valor predeterminado
    birthDate: '',
    program: '',
    sede: '' // Add sede field
  });
  const [errors, setErrors] = useState({});
  const [showEmailAlert, setShowEmailAlert] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [sedes, setSedes] = useState([]); // Add sedes state

  // Opciones para el tipo de documento
  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PAS', label: 'Pasaporte' }
  ];

  // Cargar programas académicos y sedes desde la base de datos
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setProgramsLoading(true);
        const programsData = await getAllPrograms();
        
        // Extract unique sedes from programs and sort them alphabetically
        const uniqueSedes = [...new Set(programsData.map(p => p.sede))].filter(Boolean).sort();
        setSedes(uniqueSedes.map(sede => ({ value: sede, label: sede })));
        
        setPrograms(programsData);
        console.log('Programas cargados:', programsData);
        console.log('Sedes disponibles:', uniqueSedes);
      } catch (error) {
        console.error('Error cargando programas:', error);
        // Los programas fallback ya se manejan en el servicio
      } finally {
        setProgramsLoading(false);
      }
    };

    loadPrograms();
  }, []);

  // Filter programs based on selected sede
  const filteredPrograms = formData.sede 
      ? programs.filter(p => p.sede === formData.sede)
      : [];

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
    if (!formData.personalEmail) newErrors.personalEmail = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) newErrors.personalEmail = 'Correo electrónico inválido';
    
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
    
    // Validar sede
    if (!formData.sede) newErrors.sede = 'La sede es requerida';
    
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
        sede: formData.sede,
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
            Ingresa el correo que prefieras usar. Puede ser tu correo personal o institucional.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
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
            <Grid item xs={12} md={8}>
              <StyledTextField
                name="personalEmail"
                label="Correo electrónico"
                type="email"
                fullWidth
                required
                value={formData.personalEmail}
                onChange={handleChange}
                error={!!errors.personalEmail}
                helperText={errors.personalEmail || 'Puedes usar cualquier correo (personal o institucional)'}
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
            <Grid item xs={12} md={4}>
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
                ¿Eres estudiante o docente?
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
                  value="docente" 
                  control={<Radio size="small" sx={{
                    '&.Mui-checked': {
                      color: '#B22222',
                    }
                  }}/>} 
                  label="Docente" 
                />
              </RadioGroup>
            </Grid>

            {/* Fecha de nacimiento */}
            <Grid item xs={12} md={4}>
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

            {/* Sede */}
            <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.sede} required size="small">
                    <InputLabel id="sede-label">Sede</InputLabel>
                    <StyledSelect
                        labelId="sede-label"
                        name="sede"
                        value={formData.sede}
                        onChange={(e) => {
                            handleChange(e);
                            // Clear program when sede changes
                            setFormData(prev => ({ ...prev, program: '' }));
                        }}
                        label="Sede"
                        startAdornment={
                            <InputAdornment position="start">
                                <School fontSize="small" color="action" />
                            </InputAdornment>
                        }
                    >
                        {sedes.map(sede => (
                            <MenuItem key={sede.value} value={sede.value}>
                                {sede.label}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                    {errors.sede && (
                        <Typography variant="caption" color="error">
                            {errors.sede}
                        </Typography>
                    )}
                </FormControl>
            </Grid>

            {/* Programa académico */}
            <Grid item xs={12} md={8}>
                <Autocomplete
                    options={filteredPrograms}
                    getOptionLabel={(option) => option.label || ''}
                    value={filteredPrograms.find(p => p.value === formData.program) || null}
                    onChange={(event, newValue) => {
                        const e = {
                            target: {
                                name: 'program',
                                value: newValue ? newValue.value : ''
                            }
                        };
                        handleChange(e);
                    }}
                    loading={programsLoading}
                    disabled={programsLoading || !formData.sede}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                        );
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    renderInput={(params) => (
                        <StyledTextField
                            {...params}
                            label="Programa académico"
                            placeholder={!formData.sede ? "Selecciona primero una sede" : programsLoading ? "Cargando..." : "Buscar programa..."}
                            required
                            error={!!errors.program}
                            helperText={errors.program || (filteredPrograms.length > 0 ? `${filteredPrograms.length} programas disponibles` : ' ')}
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <School fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <>
                                        {programsLoading ? <CircularProgress size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                            <School fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                            {option.label}
                        </li>
                    )}
                    noOptionsText={
                        !formData.sede 
                            ? "Selecciona primero una sede" 
                            : programsLoading 
                                ? "Cargando programas..." 
                                : "No se encontraron programas para esta sede"
                    }
                    loadingText="Cargando programas..."
                    sx={{ 
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            height: '52px',
                            fontSize: '0.95rem',
                            '&:hover fieldset': {
                                borderColor: 'rgba(0,0,0,0.3)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            transform: 'translate(14px, 15px) scale(1)',
                            fontSize: '0.95rem',
                        },
                        '& .MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                        },
                        '& .MuiFormHelperText-root': {
                            fontSize: '0.8rem',
                        }
                    }}
                />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', sm: 'flex-end' }, 
                mt: 3,
                pt: 2,
                borderTop: '1px solid rgba(0,0,0,0.08)'
              }}>
                <StyledButton
                  type="submit"
                  variant="contained"
                  disabled={loading || programsLoading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                  sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
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