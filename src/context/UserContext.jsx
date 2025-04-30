// src/context/UserContext.jsx (Updated)
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Importar la instancia de api

// Crear el contexto
const UserContext = createContext();

// Hook personalizado para usar el contexto
export const useUser = () => useContext(UserContext);

// Proveedor del contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un usuario en localStorage al cargar
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const googleToken = localStorage.getItem('google_token');
        const email = localStorage.getItem('email');
        const userId = localStorage.getItem('user_id');
        const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';

        if (googleToken && email && userId) {
          // Si tenemos la información básica del usuario en localStorage

          // Obtener datos adicionales del usuario usando la instancia 'api' y la ruta correcta
          try {
            // const response = await axios.get(`https://fsalud-server-saludunivalles-projects.vercel.app/getUser`, {
            //   params: { userId }
            // });
            const response = await api.get(`/api/users/id/${userId}`); // <-- CAMBIO AQUÍ

            // Verificar si es primer inicio de sesión basado en los datos recibidos
            const userData = response.data.data; // Acceder a los datos dentro de la propiedad 'data'
            const isNewUser = !userData.documento_usuario || !userData.tipoDoc; // Ajustar nombres de campo si es necesario
            const calculatedIsFirstLogin = isFirstLogin || isNewUser;

            setUser({
              id: userId,
              email: email,
              name: localStorage.getItem('name') || userData.nombre_usuario || email.split('@')[0], // Usar nombre de la respuesta si existe
              ...userData,
              isFirstLogin: calculatedIsFirstLogin
            });

            // Actualizar localStorage con la bandera correcta
            if (calculatedIsFirstLogin !== isFirstLogin) {
              localStorage.setItem('isFirstLogin', String(calculatedIsFirstLogin));
            }
          } catch (error) {
            console.error('Error obteniendo datos adicionales del usuario:', error); // Loguear error específico
            // Si falla obtener datos adicionales, usar datos básicos
            setUser({
              id: userId,
              email: email,
              name: localStorage.getItem('name') || email.split('@')[0],
              isFirstLogin: isFirstLogin
            });
          }

          setIsLogin(true);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Función para iniciar sesión
  const login = (userData) => {
    setUser(userData);
    setIsLogin(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('google_token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    localStorage.removeItem('isFirstLogin');
    setUser(null);
    setIsLogin(false);
  };

  // Valores disponibles en el contexto
  const value = {
    user,
    setUser,
    isLogin,
    setIsLogin,
    login,
    logout,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;