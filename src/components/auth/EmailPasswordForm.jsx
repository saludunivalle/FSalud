import React, { useState } from 'react';
import { 
  Box, 
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Container,
  Link
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  ArrowBack
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useUser } from '../../context/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';

// Estilos personalizados para el contenedor de autenticación
const AuthContainer = styled(Paper)(({ theme }) => ({
  marginTop: '2rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: '1.75rem',
  maxWidth: '400px',
  minWidth: '320px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: '2rem',
  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.0157), 0 4px 32px 0 rgba(0,0,0,0.0157), 0 2px 64px 0 rgba(0,0,0,0.0118), 0 16px 32px 0 rgba(0,0,0,0.0118)',
  border: '1px solid rgba(0,0,0,0.08)'
}));

// Estilo del botón principal
const PrimaryButton = styled(Button)(({ theme }) => ({
  height: '2.75rem',
  borderRadius: '0.6rem',
  padding: '0 1.25rem',
  minWidth: '6rem',
  whiteSpace: 'nowrap',
  backgroundColor: '#B22222',
  color: '#fff',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#8B0000',
    transform: 'scale(1.01)'
  },
  transition: 'transform 150ms cubic-bezier(0.165,0.85,0.45,1)',
  textTransform: 'none',
  fontSize: '0.95rem'
}));

// Estilo del campo de texto
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: '2.75rem',
    borderRadius: '0.6rem',
    '& fieldset': {
      borderColor: 'rgba(0,0,0,0.1)',
      transition: 'border-color 0.2s'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0,0,0,0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(0,0,0,0.3)',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'rgba(0,0,0,0.4)',
    fontSize: '0.9rem'
  }
}));

const EmailPasswordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useUser();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, introduce un correo electrónico');
      return;
    }

    if (!password) {
      setError('Por favor, introduce una contraseña');
      return;
    }

    if (isRegistering && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (isRegistering) {
        // Registrar nuevo usuario
        result = await register(email, password);
      } else {
        // Iniciar sesión con usuario existente
        result = await login(email, password);
      }
      
      if (!result.success) {
        setError(result.message || 'Error de autenticación');
      }
      // La navegación se maneja por el UserContext
    } catch (error) {
      console.error('Error de autenticación:', error);
      setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 4
      }}
    >
      <AuthContainer>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={goBack}
          sx={{ 
            alignSelf: 'flex-start',
            textTransform: 'none',
            color: 'rgba(0,0,0,0.6)',
            p: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'rgba(0,0,0,0.8)'
            } 
          }}
        >
          Volver
        </Button>
        
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
          {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <StyledTextField
            fullWidth
            id="email"
            placeholder="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!location.state?.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <StyledTextField
            fullWidth
            id="password"
            placeholder="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {isRegistering && (
            <StyledTextField
              fullWidth
              id="confirmPassword"
              placeholder="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                )
              }}
            />
          )}
          
          <PrimaryButton 
            type="submit" 
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isRegistering ? (
              'Registrarme'
            ) : (
              'Iniciar sesión'
            )}
          </PrimaryButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {isRegistering ? (
            <>
              ¿Ya tienes una cuenta?{' '}
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setIsRegistering(false)}
                sx={{ textDecoration: 'underline' }}
              >
                Inicia sesión
              </Link>
            </>
          ) : (
            <>
              ¿No tienes una cuenta?{' '}
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setIsRegistering(true)}
                sx={{ textDecoration: 'underline' }}
              >
                Regístrate
              </Link>
            </>
          )}
        </Typography>
      </AuthContainer>
    </Container>
  );
};

export default EmailPasswordForm;