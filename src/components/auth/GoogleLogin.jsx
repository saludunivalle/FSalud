// src/components/auth/GoogleLogin.jsx
import React from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { useUser } from '../../context/UserContext';

const GoogleLogin = ({ onSuccess, buttonColor = '#B22222', showSingleButton = true }) => {
  const { loginWithGoogle } = useUser();

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      
      if (result.success && onSuccess) {
        onSuccess(result.user);
      }
    } catch (error) {
      console.error('Error durante la autenticación con Google:', error);
    }
  };

  if (!showSingleButton) {
    return null; // No renderizar nada si no se solicita el botón único
  }

  return (
    <Button
      variant="contained"
      size="large"
      onClick={handleGoogleLogin}
      sx={{ 
        backgroundColor: buttonColor,
        '&:hover': {
          backgroundColor: '#8B0000',
        },
        color: 'white',
        fontWeight: 'bold',
        px: 4,
        py: 1.2
      }}
    >
      Iniciar Sesión
    </Button>
  );
};

GoogleLogin.propTypes = {
  onSuccess: PropTypes.func,
  buttonColor: PropTypes.string,
  showSingleButton: PropTypes.bool
};

export default GoogleLogin;