import React, { useEffect } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';

const GoogleLogin = ({ setIsLogin, setUserInfo, onSuccess, buttonColor = '#B22222', showSingleButton = true }) => {
  useEffect(() => {
    const loadGoogleScript = () => {
      // Remove any existing Google Sign-In script to avoid duplicates
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = initializeGoogleLogin;
    };

    const initializeGoogleLogin = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '1095230822376-9c1lomp0nfhrlblbr43nn30943v9af2o.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
        });
        
        // Only render Google button if not using custom single button
        if (!showSingleButton) {
          window.google.accounts.id.renderButton(
            document.getElementById('google-login-button'),
            { theme: 'outline', size: 'large', width: 250 }
          );
        }
      }
    };

    loadGoogleScript();
    
    return () => {
      // Clean up is now handled more safely in loadGoogleScript
    };
  }, [showSingleButton]);


const handleCredentialResponse = async (response) => {
    try {
      const idToken = response.credential;
      console.log("Enviando token a servidor...");
      
      const result = await axios.post('https://fsalud-server-saludunivalles-projects.vercel.app/api/auth/google', { 
        idToken: idToken 
      });
      
      if (result.data.success) {
        localStorage.setItem('google_token', idToken);
        localStorage.setItem('email', result.data.user.email);
        localStorage.setItem('user_id', result.data.user.id);
        localStorage.setItem('name', result.data.user.name);
        localStorage.setItem('user_role', result.data.user.role);
        localStorage.setItem('isFirstLogin', String(result.data.user.isFirstLogin));
        
        setUserInfo(result.data.user);
        setIsLogin(true);
        
        if (onSuccess) {
          onSuccess(result.data.user);
        }
      }
    } catch (error) {
      console.error('Error durante la autenticación:', error);
      alert(`Error de autenticación: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      console.error('Google API no está cargada correctamente');
      alert('Error al cargar Google API. Por favor, intenta de nuevo más tarde.');
    }
  };

  return (
    <div>
      {!showSingleButton && <div id="google-login-button"></div>}
      
      {showSingleButton && (
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
      )}
    </div>
  );
};

GoogleLogin.propTypes = {
  setIsLogin: PropTypes.func.isRequired,
  setUserInfo: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  buttonColor: PropTypes.string,
  showSingleButton: PropTypes.bool
};

export default GoogleLogin;