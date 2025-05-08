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
        const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
        const storedRole = localStorage.getItem('user_role');

        if (googleToken && email && userId) {
          try {
            // Obtener datos adicionales del usuario
            const response = await axios.get(`https://fsalud-server-saludunivalles-projects.vercel.app/getUser`, {
              params: { userId },
              headers: {
                'Authorization': `Bearer ${googleToken}`
              }
            });

            const userData = response.data;
            const isNewUser = !userData.documento_usuario || !userData.tipoDoc;
            const calculatedIsFirstLogin = isFirstLogin || isNewUser;

            // Determinar el rol del usuario
            let role = storedRole || 'estudiante';
            if (userData.es_admin) {
              role = 'administrador';
            } else if (userData.es_profesor) {
              role = 'profesor';
            }

            // Guardar el rol en localStorage
            localStorage.setItem('user_role', role);

            setUser({
              id: userId,
              email: email,
              name: localStorage.getItem('name') || userData.nombre_usuario || email.split('@')[0],
              role: role,
              ...userData,
              isFirstLogin: calculatedIsFirstLogin
            });

            if (calculatedIsFirstLogin !== isFirstLogin) {
              localStorage.setItem('isFirstLogin', String(calculatedIsFirstLogin));
            }
          } catch (error) {
            console.error('Error obteniendo datos adicionales del usuario:', error);
            setUser({
              id: userId,
              email: email,
              name: localStorage.getItem('name') || email.split('@')[0],
              role: storedRole || 'estudiante',
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
    const role = userData.role || (userData.es_admin ? 'administrador' : userData.es_profesor ? 'profesor' : 'estudiante');
    localStorage.setItem('user_role', role);

    setUser({
      ...userData,
      role: role
    });
    setIsLogin(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('google_token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    localStorage.removeItem('isFirstLogin');
    localStorage.removeItem('user_role');
    setUser(null);
    setIsLogin(false);
  };

  // Función para actualizar el rol del usuario
  const updateUserRole = (newRole) => {
    if (['estudiante', 'administrador', 'profesor'].includes(newRole)) {
      localStorage.setItem('user_role', newRole);
      setUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  // Valores disponibles en el contexto
  const value = {
    user,
    setUser,
    isLogin,
    setIsLogin,
    login,
    logout,
    loading,
    updateUserRole
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;