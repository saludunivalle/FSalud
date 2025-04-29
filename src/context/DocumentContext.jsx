// src/context/DocumentContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';

// Crear el contexto
const DocumentContext = createContext();

// Hook personalizado para usar el contexto
export const useDocuments = () => useContext(DocumentContext);

// Proveedor del contexto
export const DocumentProvider = ({ children }) => {
  const { user, isLogin } = useUser();
  const [userDocuments, setUserDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar documentos cuando el usuario inicia sesión
  useEffect(() => {
    if (!isLogin || !user) {
      setLoading(false);
      return;
    }
    
    fetchUserDocuments();
    fetchDocumentTypes();
  }, [user, isLogin]);

  // Obtener los documentos del usuario
  const fetchUserDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        'https://fsalud-server-saludunivalles-projects.vercel.app/getUserDocuments',
        { params: { userId: user.id } }
      );
      
      setUserDocuments(response.data || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setUserDocuments([]);
      } else {
        setError(err.message || 'Error al cargar documentos');
        console.error('Error fetching user documents:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener los tipos de documentos disponibles
  const fetchDocumentTypes = async () => {
    try {
      const response = await axios.get(
        'https://fsalud-server-saludunivalles-projects.vercel.app/getDocumentos'
      );
      setDocumentTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  // Función para actualizar documentos
  const refreshDocuments = async () => {
    if (!isLogin || !user) return;
    
    await fetchUserDocuments();
  };

  // Función para obtener el estado de un documento
  const getDocumentStatus = (documentId) => {
    const document = userDocuments.find(doc => doc.id_doc === documentId);
    
    if (!document) {
      return 'sin cargar';
    }
    
    return document.estado || 'pendiente';
  };

  // Función para verificar si un documento está vencido
  const isDocumentExpired = (documentId) => {
    const document = userDocuments.find(doc => doc.id_doc === documentId);
    
    if (!document || !document.fecha_vencimiento) {
      return false;
    }
    
    const expirationDate = new Date(document.fecha_vencimiento);
    const today = new Date();
    
    return expirationDate < today;
  };

  // Valores disponibles en el contexto
  const value = {
    userDocuments,
    documentTypes,
    loading,
    error,
    refreshDocuments,
    getDocumentStatus,
    isDocumentExpired
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentContext;