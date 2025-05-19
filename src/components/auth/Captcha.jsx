import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const SITE_KEY = '6LdR_mgpAAAAAGkVn2ibPMWH_viMkqYGc01a5v5B'; 

const Captcha = ({ onVerify }) => {
  const captchaRef = useRef(null);
  
  useEffect(() => {
    // Función para cargar el script de reCAPTCHA
    const loadReCaptcha = () => {
      if (!window.grecaptcha) {
        // Si el script ya está en proceso de carga, no lo cargamos de nuevo
        if (document.querySelector('script[src*="recaptcha"]')) return;
        
        // Crear el script
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
        script.async = true;
        script.defer = true;
        
        // Cuando el script se cargue, renderizar el captcha
        script.onload = () => {
          renderCaptcha();
        };
        
        // Agregar el script al DOM
        document.head.appendChild(script);
      } else {
        // Si el script ya está cargado, renderizar el captcha directamente
        renderCaptcha();
      }
    };
    
    // Función para renderizar el captcha
    const renderCaptcha = () => {
      if (window.grecaptcha && captchaRef.current) {
        window.grecaptcha.ready(() => {
          try {
            // Limpiar el contenedor en caso de que ya tenga un captcha
            if (captchaRef.current.childNodes.length > 0) {
              captchaRef.current.innerHTML = '';
            }
            
            // Renderizar el captcha
            window.grecaptcha.render(captchaRef.current, {
              sitekey: SITE_KEY,
              callback: onVerify,
              'expired-callback': () => onVerify(null),
              'error-callback': () => onVerify(null)
            });
          } catch (error) {
            console.error('Error al renderizar el captcha:', error);
          }
        });
      }
    };
    
    loadReCaptcha();
    
    // Limpiar al desmontar
    return () => {
      // Remover el captcha si existe
      if (captchaRef.current) {
        captchaRef.current.innerHTML = '';
      }
    };
  }, [onVerify]);
  
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
      <div ref={captchaRef}></div>
      {!window.grecaptcha && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Cargando captcha...
        </Typography>
      )}
    </Box>
  );
};

export default Captcha;