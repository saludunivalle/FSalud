import React, { useState } from 'react';
import { Box, Card, Typography, Tabs, Tab, TextField, Button, Divider, 
  InputAdornment, IconButton, CircularProgress, Alert } from '@mui/material';
import { Google, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

const AuthComponent = () => {
  // Hooks
  const navigate = useNavigate();
  const { login } = useUser();
  
  // State for tabs and forms
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // API URL
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app';
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
    setCodeSent(false);
    setVerificationCode('');
  };

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Error al cargar Google API. Por favor, intenta de nuevo más tarde.');
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!captchaValue) {
      setError('Por favor completa el captcha');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/send-code`, {
        email,
        captchaToken: captchaValue
      });
      
      if (response.data.success) {
        setCodeSent(true);
        setSuccess('Código enviado correctamente a tu correo electrónico');
      }
    } catch (err) {
      console.error('Error enviando código:', err);
      setError(err.response?.data?.error || 'Error al enviar el código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify-code`, {
        email,
        code: verificationCode
      });
      
      if (response.data.success) {
        login(response.data);
        
        if (response.data.user.isFirstLogin) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error verificando código:', err);
      setError(err.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (!captchaValue) {
      setError('Por favor completa el captcha');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const endpoint = tabValue === 0 ? 'login' : 'register';
      const response = await axios.post(`${BASE_URL}/api/auth/${endpoint}`, {
        email,
        password,
        captchaToken: captchaValue
      });
      
      if (response.data.success) {
        if (tabValue === 1) { // Registration
          setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
          setTabValue(0); // Switch to login tab
          setPassword('');
        } else { // Login
          login(response.data);
          
          if (response.data.user.isFirstLogin) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Error en autenticación:', err);
      setError(err.response?.data?.error || 
        (tabValue === 0 ? 'Error al iniciar sesión' : 'Error al registrarse'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 450, mx: 'auto', p: 3, boxShadow: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        {codeSent ? 'Verificar código' : 'Accede a tu cuenta'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {!codeSent && (
        <>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            sx={{ mb: 2 }}
          >
            Continuar con Google
          </Button>
          
          <Divider sx={{ my: 2 }}>o</Divider>
          
          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Iniciar sesión" />
            <Tab label="Registrarse" />
            <Tab label="Código de acceso" />
          </Tabs>
        </>
      )}
      
      {tabValue === 2 || codeSent ? (
        // Código de verificación
        <Box component="form" onSubmit={handleVerifyCode}>
          {!codeSent && (
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          )}
          
          {codeSent ? (
            <>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Hemos enviado un código de verificación a <strong>{email}</strong>
              </Typography>
              
              <TextField
                fullWidth
                label="Código de verificación"
                margin="normal"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={loading}
                required
                inputProps={{ maxLength: 6 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, bgcolor: '#B22222', '&:hover': { bgcolor: '#8B0000' } }}
                disabled={loading || !verificationCode}
              >
                {loading ? <CircularProgress size={24} /> : 'Verificar código'}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                onClick={handleSendCode}
                disabled={loading}
              >
                Reenviar código
              </Button>
            </>
          ) : (
            <>
              {!codeSent && (
                <Box sx={{ my: 2 }}>
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={setCaptchaValue}
                  />
                </Box>
              )}
              
              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 2, bgcolor: '#B22222', '&:hover': { bgcolor: '#8B0000' } }}
                disabled={loading || !captchaValue || !email}
                onClick={handleSendCode}
              >
                {loading ? <CircularProgress size={24} /> : 'Enviar código de verificación'}
              </Button>
            </>
          )}
        </Box>
      ) : (
        // Login o registro con correo y contraseña
        <Box component="form" onSubmit={handleEmailPasswordSubmit}>
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            fullWidth
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ my: 2 }}>
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={setCaptchaValue}
            />
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, bgcolor: '#B22222', '&:hover': { bgcolor: '#8B0000' } }}
            disabled={loading || !captchaValue}
          >
            {loading ? <CircularProgress size={24} /> : 
              (tabValue === 0 ? 'Iniciar sesión' : 'Registrarse')}
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default AuthComponent;