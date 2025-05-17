// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getCurrentUser, 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logoutUser 
} from '../services/authService';

// Create context first
const UserContext = createContext(null);

// Export useUser hook
export const useUser = () => useContext(UserContext);

// Component definition
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsLogin(true);
          
          // Guardar información en localStorage para compatibilidad con código existente
          localStorage.setItem('email', currentUser.email);
          localStorage.setItem('user_id', currentUser.id);
          localStorage.setItem('name', currentUser.name || '');
          localStorage.setItem('user_role', currentUser.role || 'estudiante');
          localStorage.setItem('isFirstLogin', String(currentUser.isFirstLogin || false));
          localStorage.setItem('firebase_token', currentUser.token);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Función para iniciar sesión con correo/contraseña
  const login = async (email, password) => {
    const result = await loginWithEmail(email, password);
    
    if (result.success) {
      setUser(result.user);
      setIsLogin(true);
      
      // Guardar datos en localStorage
      localStorage.setItem('email', result.user.email);
      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('name', result.user.name || '');
      localStorage.setItem('user_role', result.user.role || 'estudiante');
      localStorage.setItem('isFirstLogin', String(result.user.isFirstLogin || false));
      localStorage.setItem('firebase_token', result.token);
    }
    
    return result;
  };

  // Función para registrarse con correo/contraseña
  const register = async (email, password) => {
    const result = await registerWithEmail(email, password);
    
    if (result.success) {
      setUser(result.user);
      setIsLogin(true);
      
      // Guardar datos en localStorage
      localStorage.setItem('email', result.user.email);
      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('name', result.user.name || '');
      localStorage.setItem('user_role', result.user.role || 'estudiante');
      localStorage.setItem('isFirstLogin', String(result.user.isFirstLogin || true));
      localStorage.setItem('firebase_token', result.token);
    }
    
    return result;
  };

  // Función para iniciar sesión con Google
  const loginWithGoogleAuth = async () => {
    const result = await loginWithGoogle();
    
    if (result.success) {
      setUser(result.user);
      setIsLogin(true);
      
      // Guardar datos en localStorage
      localStorage.setItem('email', result.user.email);
      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('name', result.user.name || '');
      localStorage.setItem('user_role', result.user.role || 'estudiante');
      localStorage.setItem('isFirstLogin', String(result.user.isFirstLogin || false));
      localStorage.setItem('firebase_token', result.token);
      localStorage.setItem('google_token', result.token); // Para compatibilidad con código existente
    }
    
    return result;
  };

  // Función para cerrar sesión
  const logout = async () => {
    await logoutUser();
    
    // Limpiar estado y localStorage
    setUser(null);
    setIsLogin(false);
    localStorage.removeItem('email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('isFirstLogin');
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('google_token');
    localStorage.removeItem('token');
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
    register,
    loginWithGoogle: loginWithGoogleAuth,
    logout,
    loading,
    updateUserRole
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Export provider component
export { UserProvider };

// Export context as default
export default UserContext;