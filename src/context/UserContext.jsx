// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
        
        if (googleToken && email && userId) {
          // Si tenemos la información básica del usuario en localStorage
          setUser({
            id: userId,
            email: email,
            name: localStorage.getItem('name') || email.split('@')[0]
          });
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