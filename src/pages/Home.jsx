import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';
// Add ReCAPTCHA import
import ReCAPTCHA from "react-google-recaptcha";

import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Container,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress
} from '@mui/material';
import { Email, Google, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Estilos personalizados para el contenedor de autenticación
const AuthContainer = styled(Paper)(({ theme }) => ({
  marginTop: '1rem',
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

// Estilos para el header
const HeaderContainer = styled(Box)(({ theme }) => ({
  marginTop: '2rem',
  marginBottom: '1.5rem',
  textAlign: 'center'
}));

// Estilo del botón de Google
const GoogleButton = styled(Button)(({ theme }) => ({
  height: '2.75rem',
  borderRadius: '0.6rem',
  padding: '0 1.25rem',
  minWidth: '6rem',
  whiteSpace: 'nowrap',
  width: '100%',
  gap: '0.5rem',
  fontWeight: 500,
  // Fondo blanco puro para que se vea más limpio
  backgroundColor: '#ffffff',
  // Borde más sutil para un aspecto moderno
  border: '1px solid rgba(0,0,0,0.1)',
  color: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  display: 'inline-flex',
  textTransform: 'none',
  fontSize: '0.95rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  // Efecto hover mejorado
  '&:hover': {
    backgroundColor: '#f8f8f8',
    boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
    transform: 'translateY(-1px)',
    border: '1px solid rgba(0,0,0,0.15)',
  },
  // Efecto al hacer clic
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  // Estilo cuando está deshabilitado
  '&.Mui-disabled': {
    backgroundColor: '#f5f5f5',
    color: 'rgba(0,0,0,0.4)',
  },
  transition: 'all 150ms cubic-bezier(0.165,0.85,0.45,1)',
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

const Home = () => {
  const { isLogin, user, loading: userLoading, login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Existing login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Add state for captcha
  const [captchaValue, setCaptchaValue] = useState(null);
  
  // UI states
  const [loginStep, setLoginStep] = useState('initial');
  const [loginMethod, setLoginMethod] = useState(2);
  const [showSSOOption, setShowSSOOption] = useState(false);
  const [loginError, setLoginError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [testCode, setTestCode] = useState('');

  // Add reCAPTCHA site key
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  
  // Google client ID
  const GOOGLE_CLIENT_ID = '340874428494-ot9uprkvvq4ha529arl97e9mehfojm5b.apps.googleusercontent.com';
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';

  // Initialize Google Sign-In
  useEffect(() => {
    const loadGoogleScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          // Solo inicializamos la autenticación, sin renderizar el botón
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
          });
        }
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
    
    // Cleanup function
    return () => {
      // No need for complex cleanup
    };
  }, []);

  // Handle Google Sign-In response
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setLoginError('');
    
    try {
      const idToken = response.credential;
      
      const result = await axios.post(`${BASE_URL}/api/auth/google`, { 
        idToken: idToken 
      });
      
      if (result.data.success) {
        login(result.data);
        // Navigation will be handled by the useEffect
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      setLoginError(error.response?.data?.error || 'Error al iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar navegación después del login
  useEffect(() => {
    if (isLogin && user && !userLoading) {
      const defaultRoute = user.role === 'profesor' || user.role === 'administrador' 
        ? '/dashboard' 
        : user.isFirstLogin === true ? '/complete-profile' : '/dashboard';
      
      const from = location.state?.from?.pathname || defaultRoute;
      navigate(from, { replace: true });
    }
  }, [isLogin, user, userLoading, navigate, location.state]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setLoginError('Por favor introduce un correo electrónico');
      return;
    }
    
    // Mostrar opciones de inicio de sesión
    setLoginStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setLoginError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);
    setLoginError('');
    
    try {
      const endpoint = loginMethod === 0 ? 'login' : 'register';
      const response = await axios.post(`${BASE_URL}/api/auth/${endpoint}`, {
        email,
        password
      });
      
      if (response.data.success) {
        if (loginMethod === 1) { // Registration
          setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
          setLoginMethod(0); // Switch to login tab
          setPassword('');
        } else { // Login
          login(response.data);
          // Navigation will be handled by the useEffect
        }
      }
    } catch (err) {
      console.error('Error en autenticación:', err);
      setLoginError(err.response?.data?.error || 
        (loginMethod === 0 ? 'Error al iniciar sesión' : 'Error al registrarse'));
    } finally {
      setLoading(false);
    }
  };

  // Modificar la función handleSendCode para capturar el código
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setLoginError('Por favor ingresa tu correo electrónico');
      return;
    }
    
    // Verify if captcha has been completed
    if (!captchaValue) {
      setLoginError('Por favor completa el captcha');
      return;
    }

    setLoading(true);
    setLoginError('');
    
    try {
      // Include captcha token in the request
      const response = await axios.post(`${BASE_URL}/api/auth/send-code`, {
        email,
        captchaToken: captchaValue  // Send captcha token to backend
      });
      
      if (response.data.success) {
        setLoginStep('code');
        setSuccess('Código enviado correctamente a tu correo electrónico');
        
        // Save verification code if available
        if (response.data.testCode) {
          setTestCode(response.data.testCode);
        }
      }
    } catch (err) {
      console.error('Error enviando código:', err);
      const errorMessage = err.response?.data?.error || 
                          'Error al enviar el código de verificación. Por favor intenta más tarde.';
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setLoginError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setLoginError('');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify-code`, {
        email,
        code: verificationCode
      });
      
      if (response.data.success) {
        login(response.data);
        // Navigation will be handled by the useEffect
      }
    } catch (err) {
      console.error('Error verificando código:', err);
      setLoginError(err.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setLoginStep('initial');
    setLoginError('');
    setSuccess('');
  };

  // Agrega esta función para manejar el click en el botón personalizado
  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setLoginError('Error al cargar Google API. Por favor, intenta de nuevo más tarde.');
    }
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
      {/* Header */}
      <HeaderContainer>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="#B22222">
          Facultad de Salud
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Gestor documentos profesionales en escenarios de practica 
        </Typography>
      </HeaderContainer>
      
      {/* Error and success messages */}
      {loginError && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: '400px', 
            marginBottom: 2
          }}
        >
          {loginError}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%', 
            maxWidth: '400px', 
            marginBottom: 2
          }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      
      <AuthContainer>
        {/* Initial login step */}
        {loginStep === 'initial' && (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Reemplaza el contenedor del botón de Google con un botón personalizado */}
                <GoogleButton
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={18} /> : 
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                      alt="Google logo" 
                      style={{ height: 18, width: 18 }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDkuNWMzLjU0IDAgNi43MSAxLjIyIDkuMjEgMy42bDYuODUtNi44NUMzNS45IDIuMzggMzAuNDcgMCAyNCAwIDExLjUxIDAgMS45MiAxMC40OC0uMDIgMjMuNGwxMS42MiAxLjQ3QzEyLjY5IDE1IDEwLjU2IDkuNSAyNCA9LjU6IC4wMiAyMy40MSAxLjQ1IDAgMS4zMiAxMC4yMi0uMDIgMjMuNGwxMS42MiAxLjQ3QzEyLjY5IDE1IDEwLjU2IDkuNSAyNCA5LjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTIzLjk5IDM4Yy03LjQzIDAtMTMuNDItNS4wMS0xNS40LTExLjd4aC0uMDFsLTEyLjAzIDEuNTFDLTAuNjkgMzcuNzYgMTAuNzcgNDggMjMuOTkgNDhjNS41MyAwIDEwLjktMi44NCAxNC44OS03LjQybC0uMDEtLjAyLTcuNTEtNS44M3YtLjAwMkMyOS40OSAzNi43OCAyNiAzOCAyMy45OSAzOHoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNMzguOTkgMjRjMC0xLjQyLS4zNS0zLjA5LS44NC00LjQzSDI0djkuMTJoOS4wNmMtLjM3IDEuNTYtMS41NSA0LjM3LTQuMzQgNi4xMWw3LjUxIDUuODNjNS0zLjkgNy43Ni05Ljg2IDcuNzYtMTYuNjN6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTI0IDQ4YzMuMiAwIDUuODctLjQ5IDguMzktMS4yNiAyLjc2LS44MSA1LjAxLTIuMTkgNi45Ny0zLjlsLTcuNTEtNS44M3MtMi4xIDEuNDUtNC4zIDIuMzQtNy44NCAyLjM0QzEwLjcgMzkuNTUgMi40NiAyOC45OCAyLjQxIDI3LjlsLTExLjE4IDMuMDFDLTEuMzEgMzcuOCAxMC43MSA0OCAyNCA0OHoiLz48L3N2Zz4="
                      }}
                    />
                  }
                >
                  {loading ? 'Procesando...' : 'Continuar con Google'}
                </GoogleButton>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center"
                  sx={{ 
                    textTransform: 'uppercase', 
                    fontSize: '0.75rem',
                    padding: '0.25rem 0'
                  }}
                >
                  o
                </Typography>
                
                <Box component="form" onSubmit={handleEmailSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <StyledTextField
                    fullWidth
                    id="email"
                    placeholder="Introduce tu correo personal o del trabajo"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <PrimaryButton type="submit">
                    Continuar con correo electrónico
                  </PrimaryButton>
                </Box>
              </Box>
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem', 
                lineHeight: 1.5,
                textAlign: 'center'
              }}
            >
              Inicie sesión preferiblemente con <strong>Google</strong> para una mejor experiencia.
            </Typography>
          </>
        )}

        {/* Password step - where we add the reCAPTCHA */}
        {loginStep === 'password' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ color: '#333', fontWeight: 500 }}>
              Accede a tu cuenta
            </Typography>
            
            <Button
              variant="text"
              startIcon={<Email />}
              fullWidth
              sx={{ 
                mb: 2,
                justifyContent: 'flex-start',
                color: 'rgba(0,0,0,0.6)',
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderRadius: '0.6rem',
                padding: '0.5rem 1rem',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.06)'
                }
              }}
              onClick={handleBackToEmail}
            >
              {email}
            </Button>
            
            <Typography variant="h6" align="center" gutterBottom sx={{ color: '#666', fontWeight: 400, mb: 3 }}>
              Código de acceso
            </Typography>
            
            <Box component="form" onSubmit={handleSendCode} sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                Te enviaremos un código de verificación de un solo uso a tu correo electrónico.
              </Typography>
              
              {/* Add reCAPTCHA component */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <ReCAPTCHA
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={setCaptchaValue}
                />
              </Box>
              
              <PrimaryButton
                type="submit"
                fullWidth
                disabled={loading || !captchaValue} // Disable button if captcha not completed
                sx={{ 
                  boxShadow: '0 2px 4px rgba(178,34,34,0.2)',
                  transition: 'all 150ms ease-in-out'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar código de verificación'}
              </PrimaryButton>
            </Box>
            
            <Button
              variant="text"
              onClick={handleBackToEmail}
              disabled={loading}
              size="small"
              sx={{ 
                mt: 3,
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'none',
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Volver atrás
            </Button>
          </>
        )}

        {loginStep === 'code' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ color: '#333', fontWeight: 500 }}>
              Verificar código
            </Typography>
            
            <Box sx={{ 
              backgroundColor: 'rgba(33, 150, 243, 0.08)', 
              p: 2, 
              borderRadius: '0.6rem',
              mb: 3  
            }}>
              <Typography variant="body2" color="primary.main">
                Hemos enviado un código de verificación a <strong>{email}</strong>
              </Typography>
            </Box>
            
            <Box component="form" onSubmit={handleVerifyCode} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TextField
                fullWidth
                label="Código de verificación"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={loading}
                required
                inputProps={{ 
                  maxLength: 6,
                  style: { letterSpacing: '0.5em', textAlign: 'center', fontWeight: 500 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.6rem',
                    '& fieldset': {
                      borderColor: 'rgba(0,0,0,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0,0,0,0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#B22222',
                      borderWidth: '1px'
                    },
                  }
                }}
              />
              
              <PrimaryButton
                type="submit"
                fullWidth
                disabled={loading || !verificationCode}
                sx={{ 
                  boxShadow: '0 2px 4px rgba(178,34,34,0.2)',
                  transition: 'all 150ms ease-in-out'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verificar código'}
              </PrimaryButton>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  variant="text"
                  onClick={handleSendCode}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    color: '#B22222', 
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Reenviar código
                </Button>
                
                <Button
                  variant="text"
                  onClick={handleBackToEmail}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    color: 'rgba(0,0,0,0.6)',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Volver atrás
                </Button>
              </Box>
            </Box>
          </>
        )}
      </AuthContainer>
    </Container>
  );
};

export default Home;