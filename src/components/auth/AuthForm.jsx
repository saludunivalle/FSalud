import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Login, PersonAdd } from '@mui/icons-material';
import { useUser } from '../../context/UserContext';

// Panel personalizado para cada tab
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AuthForm = ({ onSuccess, initialTab = 0 }) => {
  // Estado para los tabs (Login/Register)
  const [tabValue, setTabValue] = useState(initialTab);
  
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para el formulario
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  // Estados para errores, carga y mensajes
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isLogin, user, setUser, setIsLogin } = useUser();

  
  // Cambiar entre tabs
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLoginError('');
    setRegisterError('');
    setResetEmailSent(false);
  };
  
  // Manejar cambios en los campos de login
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError('');
    
    // Si es el campo de email, también actualizar el email para recuperación
    if (name === 'email') {
      setResetEmail(value);
    }
  };
  
  // Manejar cambios en los campos de registro
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (registerError) setRegisterError('');
  };
  
  // Alternar visibilidad de contraseña
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Validar formulario de login
  const validateLoginForm = () => {
    if (!loginForm.email.trim()) {
      setLoginError('El correo electrónico es requerido');
      return false;
    }
    if (!loginForm.password) {
      setLoginError('La contraseña es requerida');
      return false;
    }
    return true;
  };
  
  // Validar formulario de registro
  const validateRegisterForm = () => {
    if (!registerForm.email.trim()) {
      setRegisterError('El correo electrónico es requerido');
      return false;
    }
    if (!registerForm.password) {
      setRegisterError('La contraseña es requerida');
      return false;
    }
    if (registerForm.password.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };
  
  // Enviar formulario de login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    
    setLoading(true);
    try {
      // Simulando llamada a API de login
      // En producción, reemplazar por la llamada real
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ id: '123', email: loginForm.email, name: 'Usuario Demo' });
        }
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error de login:', error);
      setLoginError('Error al iniciar sesión');

      setLoading(false);
    }
  };
  
  // Enviar formulario de registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    try {

      // Simulando llamada a API de registro
      // En producción, reemplazar por la llamada real
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ id: '123', email: registerForm.email, name: 'Usuario Nuevo' });
        }
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error de registro:', error);
      setRegisterError('Error al registrarse');

      setLoading(false);
    }
  };
  
  // Iniciar sesión con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Abrir el popup de Google
      window.google.accounts.id.prompt();
      setLoading(false);
    } catch (error) {
      console.error('Error de Google login:', error);
      setLoginError('Error al iniciar sesión con Google');

      setLoading(false);
    }
  };
  
  // Enviar email de recuperación de contraseña
  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      setLoginError('Ingresa tu correo electrónico para recuperar tu contraseña');
      return;
    }
    
    setLoading(true);
    try {

      // Simulando envío de correo de recuperación
      // En producción, reemplazar por la llamada real
      setTimeout(() => {
        setResetEmailSent(true);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      setLoginError('Error al enviar el correo de recuperación');
      setLoading(false);
    }
  };

  // Estilo para los botones de autenticación
  const authButtonStyle = {
    backgroundColor: '#B22222',
    '&:hover': {
      backgroundColor: '#8B0000',
    },
    color: 'white',
    fontWeight: 'bold',
    py: 1.2,
    mt: 2,
    borderRadius: 2
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 3, 
      maxWidth: 400, 
      mx: 'auto', 
      borderRadius: 2,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
      }
    }}>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        centered
        textColor="primary"
        indicatorColor="primary"
        sx={{ 
          mb: 2,
          '& .MuiTab-root': {
            minWidth: 120,
            fontWeight: 'medium'
          } 
        }}
      >
        <Tab icon={<Login />} iconPosition="start" label="Iniciar Sesión" id="auth-tab-0" />
        <Tab icon={<PersonAdd />} iconPosition="start" label="Registrarme" id="auth-tab-1" />
      </Tabs>
      
      <Button
        fullWidth
        variant="outlined"
        onClick={handleGoogleLogin}
        disabled={loading}
        startIcon={
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google logo" 
            style={{ height: 18, width: 18 }} 
          />
        }
        sx={{ 
          borderColor: '#ccc',
          color: '#757575',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          py: 1,
          '&:hover': {
            borderColor: '#aaa',
            backgroundColor: '#f9f9f9'
          }
        }}
      >
        Continuar con Google
      </Button>
      
      <Divider sx={{ mt: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
          o con email
        </Typography>
      </Divider>
      
      <TabPanel value={tabValue} index={0}>
        {loginError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem', py: 0.5 }}>
            {loginError}
          </Alert>
        )}
        
        {resetEmailSent && (
          <Alert severity="success" sx={{ mb: 2, fontSize: '0.85rem', py: 0.5 }}>
            Hemos enviado las instrucciones para recuperar tu contraseña a {resetEmail}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLoginSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={loginForm.email}
            onChange={handleLoginChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={loginForm.password}
            onChange={handleLoginChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" fontSize="small" />
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
              ),
            }}
            size="small"
          />
          
          <Box sx={{ textAlign: 'right', mt: 1, mb: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                handlePasswordReset();
              }}
              sx={{ fontSize: '0.8rem' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={authButtonStyle}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
          </Button>
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {registerError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem', py: 0.5 }}>
            {registerError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="register-email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            value={registerForm.email}
            onChange={handleRegisterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="register-password"
            autoComplete="new-password"
            value={registerForm.password}
            onChange={handleRegisterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" fontSize="small" />
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
              ),
            }}
            size="small"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirm-password"
            value={registerForm.confirmPassword}
            onChange={handleRegisterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPassword}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            La contraseña debe tener al menos 6 caracteres.
          </Typography>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={authButtonStyle}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarme'}
          </Button>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default AuthForm;