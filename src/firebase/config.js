import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDRsQR01_uIroFNQv_dvxYQ49gbVM7KXRg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "documentosfsalud.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "documentosfsalud",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "documentosfsalud.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1095230822376",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1095230822376:web:abc123def456ghi789"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };