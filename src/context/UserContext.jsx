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
        const storedRole = localStorage.getItem('user_role'); // Role from previous session/login

        if (googleToken && email && userId) {
          try {
            const response = await axios.get(`https://fsalud-server-saludunivalles-projects.vercel.app/api/users/id/${userId}`, {
              headers: {
                'Authorization': `Bearer ${googleToken}`
              }
            });

            const backendUserResponse = response.data; // Expected: { success: true, data: userObject }
            
            if (backendUserResponse.success && backendUserResponse.data) {
              const userFromServer = backendUserResponse.data; // This is the actual user object
              
              // Determine role: Prioritize role from server, fallback to localStorage if needed.
              let roleFromSource = userFromServer.rol || storedRole || 'estudiante';
              const normalizedRole = roleFromSource.toLowerCase();
              localStorage.setItem('user_role', normalizedRole); // Persist normalized role

              // Determine isFirstLogin:
              // For professors/admins, it's always false.
              // For students, rely on what was stored during login (which comes from backend's isFirstLogin)
              // or what FirstLoginForm set after completion.
              let finalIsFirstLoginValue;
              if (normalizedRole === 'admin' || normalizedRole === 'administrador') {
                finalIsFirstLoginValue = false;
              } else {
                // This value in localStorage is set by login() or FirstLoginForm.jsx
                finalIsFirstLoginValue = localStorage.getItem('isFirstLogin') === 'true';
              }

              setUser({
                id: userId, // from localStorage, should match userFromServer.id_usuario
                email: email, // from localStorage, should match userFromServer.correo_usuario
                name: localStorage.getItem('name') || `${userFromServer.nombre_usuario || ''} ${userFromServer.apellido_usuario || ''}`.trim() || email.split('@')[0],
                role: normalizedRole,
                ...userFromServer, // Spread all properties from userFromServer
                isFirstLogin: finalIsFirstLoginValue 
              });
              
              // Ensure localStorage reflects the determined isFirstLogin state
              localStorage.setItem('isFirstLogin', String(finalIsFirstLoginValue));
              // Update name in localStorage if a more complete one was fetched from server
              const serverName = `${userFromServer.nombre_usuario || ''} ${userFromServer.apellido_usuario || ''}`.trim();
              if (serverName) {
                localStorage.setItem('name', serverName);
              }

            } else {
              // Fallback if /getUser failed or returned unexpected structure
              console.warn('Failed to get full user data from server or data missing, using localStorage role.');
              const lsRole = storedRole || 'estudiante';
              const normalizedLsRole = lsRole.toLowerCase();
              let fallbackIsFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
              if (normalizedLsRole === 'admin' || normalizedLsRole === 'administrador') {
                  fallbackIsFirstLogin = false;
              }
              setUser({
                id: userId,
                email: email,
                name: localStorage.getItem('name') || email.split('@')[0],
                role: normalizedLsRole,
                isFirstLogin: fallbackIsFirstLogin
              });
            }
            setIsLogin(true);
          } catch (error) {
            console.error('Error obteniendo datos adicionales del usuario durante checkUserSession:', error);
            // Fallback: use localStorage data if API call fails
            const lsRole = localStorage.getItem('user_role') || 'estudiante';
            const normalizedLsRole = lsRole.toLowerCase();
            let fallbackIsFirstLogin = localStorage.getItem('isFirstLogin') === 'true';

            if (normalizedLsRole === 'admin' || normalizedLsRole === 'administrador') {
                fallbackIsFirstLogin = false;
            }
            setUser({
              id: userId,
              email: email,
              name: localStorage.getItem('name') || email.split('@')[0],
              role: normalizedLsRole,
              isFirstLogin: fallbackIsFirstLogin
            });
            setIsLogin(true); // Still consider logged in if basic tokens exist
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []); // Ensure dependencies are correct if any are added inside

  // Función para iniciar sesión
  const login = (backendResponse) => { // backendResponse is the full object from authController {success, user, token}
    if (!backendResponse || !backendResponse.user || !backendResponse.token) {
      console.error("Invalid backendResponse in login function", backendResponse);
      return;
    }
    const userObject = backendResponse.user;
    const token = backendResponse.token;

    console.log('🔑 Guardando JWT token en localStorage:', token.substring(0, 50) + '...');

    const rawRole = userObject.role || 'estudiante'; // Role from backend user object
    const normalizedRole = rawRole.toLowerCase();
    
    localStorage.setItem('user_role', normalizedRole);
    localStorage.setItem('google_token', token); 
    localStorage.setItem('email', userObject.email);
    localStorage.setItem('user_id', userObject.id);
    localStorage.setItem('name', userObject.name);
    localStorage.setItem('isFirstLogin', String(userObject.isFirstLogin)); // isFirstLogin from backend

    setUser({
      ...userObject, // Contains id, email, name, isFirstLogin from backend
      role: normalizedRole, // Override with normalized role
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
    if (['estudiante', 'administrador', 'admin', 'docente'].includes(newRole)) {
      localStorage.setItem('user_role', newRole);
      setUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  // Add this function to the context if you need a specific Google login handler
  const loginWithGoogle = async (idToken) => {
    try {
      const result = await axios.post('https://fsalud-server-saludunivalles-projects.vercel.app/api/auth/google', { 
        idToken: idToken 
      });
      
      if (result.data.success) {
        login(result.data);
        return result.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error during Google authentication:', error);
      throw error;
    }
  };

  // Valores disponibles en el contexto
  const value = {
    user,
    setUser,
    isLogin,
    setIsLogin,
    login,
    loginWithGoogle, // Add this function
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