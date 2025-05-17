// src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';

// API Endpoint base
const BASE_URL = 'https://fsalud-server-saludunivalles-projects.vercel.app';

// Proveedor para autenticación con Google
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'  // Forzar selección de cuenta
});

// Registrar un usuario con correo y contraseña
export const registerWithEmail = async (email, password) => {
  try {
    // Crear el usuario en Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Obtener el token de Firebase
    const idToken = await firebaseUser.getIdToken();
    
    // Registrar el usuario en tu backend (Google Sheets)
    const response = await axios.post(`${BASE_URL}/api/auth/register-firebase`, {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || ''
    }, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    // Retornar la información necesaria
    return {
      success: true,
      user: {
        id: response.data.userId || firebaseUser.uid, // ID de tu sistema o Firebase UID
        email: firebaseUser.email,
        name: firebaseUser.displayName || email.split('@')[0],
        role: response.data.role || 'estudiante',
        isFirstLogin: true // Nuevos usuarios siempre necesitan completar perfil
      },
      token: idToken
    };
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: 'Este correo ya está registrado' };
    }
    
    return { success: false, message: error.message || 'Error al registrarse' };
  }
};

// Iniciar sesión con correo y contraseña
export const loginWithEmail = async (email, password) => {
  try {
    // Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Obtener el token de Firebase
    const idToken = await firebaseUser.getIdToken();
    
    // Obtener datos adicionales del usuario desde tu backend
    const response = await axios.get(`${BASE_URL}/api/auth/user-data`, {
      params: { firebaseUid: firebaseUser.uid },
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    // Retornar la información necesaria
    return {
      success: true,
      user: {
        id: response.data.userId || firebaseUser.uid,
        email: firebaseUser.email,
        name: response.data.name || firebaseUser.displayName || email.split('@')[0],
        role: response.data.role || 'estudiante',
        isFirstLogin: response.data.isFirstLogin || false
      },
      token: idToken
    };
  } catch (error) {
    console.error('Error en login:', error);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return { success: false, message: 'Correo o contraseña incorrectos' };
    }
    
    return { success: false, message: error.message || 'Error al iniciar sesión' };
  }
};

// Iniciar sesión con Google
export const loginWithGoogle = async () => {
  try {
    // Intentar con popup primero (más amigable para UX)
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    
    // Obtener el token de Firebase
    const idToken = await firebaseUser.getIdToken();
    
    // Enviar información a tu backend
    const response = await axios.post(`${BASE_URL}/api/auth/google-firebase`, {
      id: firebaseUser.uid,                           // Changed from firebaseUid
      email: firebaseUser.email,
      name: firebaseUser.displayName || ''            // Changed from displayName
    }, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    // Retornar la información necesaria
    return {
      success: true,
      user: {
        id: response.data.userId || firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: response.data.role || 'estudiante',
        isFirstLogin: response.data.isFirstLogin || false
      },
      token: idToken
    };
  } catch (error) {
    console.error('Error en login con Google:', error);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, cancelled: true };
    }
    
    // Manejar errores del servidor
    if (error.response && error.response.status === 500) {
      const errorMsg = error.response.data?.details || 
                      'Error del servidor. Contacta al administrador.';
      
      console.warn('Server error during Google login:', errorMsg);
      
      // Guardar datos mínimos del usuario desde Firebase directamente si el servidor falla
      try {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          return {
            success: true,
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role: 'estudiante', // Rol predeterminado hasta que el servidor pueda verificar
              isFirstLogin: true
            },
            token: idToken,
            serverError: true // Indicador de que la verificación del servidor no se completó
          };
        }
      } catch (fallbackError) {
        console.error('Fallback error handling failed:', fallbackError);
      }
    }
    
    // Si hay un error de popup bloqueado, intentar con redirección
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { success: true, redirected: true };
      } catch (redirectError) {
        console.error('Error en redirección:', redirectError);
        return { success: false, message: 'El navegador bloqueó la ventana emergente' };
      }
    }
    
    return { success: false, message: error.message || 'Error al iniciar sesión con Google' };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, message: error.message };
  }
};

// Recuperar contraseña
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email de recuperación:', error);
    
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No existe un usuario con este correo' };
    }
    
    return { success: false, message: error.message || 'Error al enviar email de recuperación' };
  }
};

// Verificar estado de autenticación
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      
      if (user) {
        try {
          // Obtener token actualizado
          const idToken = await user.getIdToken();
          
          // Try to get user data from backend
          try {
            const response = await axios.get(`${BASE_URL}/api/auth/user-data`, {
              params: { firebaseUid: user.uid },
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            
            resolve({
              id: response.data.userId || user.uid,
              email: user.email,
              name: response.data.name || user.displayName || user.email.split('@')[0],
              role: response.data.role || 'estudiante',
              isFirstLogin: response.data.isFirstLogin || false,
              token: idToken
            });
          } catch (error) {
            // Enhanced error handling
            console.warn('Backend service unavailable or returned error:', error.message);
            console.warn('Using Firebase user data as fallback');
            
            // Check if user has completed profile before in localStorage
            const previouslyCompleted = localStorage.getItem('isFirstLogin') === 'false';
            
            resolve({
              id: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: 'estudiante', // Default role
              isFirstLogin: !previouslyCompleted, // Use localStorage history if available
              token: idToken
            });
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};