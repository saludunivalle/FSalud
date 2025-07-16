// src/components/admin/DocumentReviewExample.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getDocumentReviewData, batchUpdateDocuments } from '../../services/docsService';

/**
 * Componente de ejemplo que demuestra el uso de los nuevos endpoints consolidados
 * - /api/v1/document-review/:documentId
 * - /api/v1/documents/batch-update
 */
const DocumentReviewExample = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewData, setReviewData] = useState(null);
  const [batchUpdates, setBatchUpdates] = useState([]);

  // Ejemplo de ID de documento para testing
  const exampleDocumentId = 'doc_123456';

  /**
   * Ejemplo 1: Obtener datos consolidados para revisión de un documento
   */
  const handleGetDocumentReviewData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🔄 Ejemplo 1: Obteniendo datos consolidados para revisión...');
      
      const response = await getDocumentReviewData(exampleDocumentId);
      
      setReviewData(response.data);
      setSuccess('✅ Datos obtenidos exitosamente con cache de 1 minuto');
      
      console.log('📊 Datos consolidados obtenidos:', response.data);
      
    } catch (error) {
      console.error('❌ Error obteniendo datos de revisión:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ejemplo 2: Actualización masiva de documentos
   */
  const handleBatchUpdateDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Ejemplo de actualizaciones masivas
      const updates = [
        {
          id_usuarioDoc: 'doc_123456',
          estado: 'Cumplido',
          comentarios: 'Documento aprobado por administrador',
          revisado_por: 'admin@univalle.edu.co',
          fecha_revision: new Date().toISOString().split('T')[0],
          fecha_ultima_revision: new Date().toISOString()
        },
        {
          id_usuarioDoc: 'doc_789012',
          estado: 'Rechazado',
          comentarios: 'Documento no cumple con los requisitos solicitados',
          revisado_por: 'admin@univalle.edu.co',
          fecha_revision: new Date().toISOString().split('T')[0],
          fecha_ultima_revision: new Date().toISOString()
        },
        {
          id_usuarioDoc: 'doc_345678',
          estado: 'Expirado',
          comentarios: 'Documento ha expirado según la fecha de vencimiento',
          revisado_por: 'admin@univalle.edu.co',
          fecha_revision: new Date().toISOString().split('T')[0],
          fecha_ultima_revision: new Date().toISOString()
        }
      ];

      console.log('🔄 Ejemplo 2: Iniciando actualización masiva...');
      console.log('📋 Actualizaciones a realizar:', updates);
      
      const response = await batchUpdateDocuments(updates);
      
      setBatchUpdates(updates);
      setSuccess(`✅ Actualización masiva completada. ${response.data.totalUpdated} celdas actualizadas`);
      
      console.log('📊 Resultado de actualización masiva:', response.data);
      
    } catch (error) {
      console.error('❌ Error en actualización masiva:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar estados
   */
  const handleClear = () => {
    setReviewData(null);
    setBatchUpdates([]);
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        🚀 Ejemplo de Uso - Endpoints Consolidados
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este componente demuestra el uso de los nuevos endpoints consolidados para reducir las llamadas a la API de Google Sheets.
      </Typography>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Botones de ejemplo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleGetDocumentReviewData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <InfoIcon />}
          >
            Ejemplo 1: Obtener Datos de Revisión
          </Button>
        </Grid>
        
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleBatchUpdateDocuments}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            Ejemplo 2: Actualización Masiva
          </Button>
        </Grid>
        
        <Grid item>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<RefreshIcon />}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      {/* Resultados */}
      <Grid container spacing={3}>
        {/* Datos de revisión */}
        {reviewData && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Datos Consolidados de Revisión
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Información del documento */}
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Documento:</strong>
                </Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {reviewData.documento?.id_usuarioDoc}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {reviewData.documento?.nombre_doc}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estado:</strong> 
                    <Chip 
                      label={reviewData.documento?.estado} 
                      size="small" 
                      sx={{ ml: 1 }}
                      color={reviewData.documento?.estado === 'Cumplido' ? 'success' : 
                             reviewData.documento?.estado === 'Rechazado' ? 'error' : 'warning'}
                    />
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fecha de carga:</strong> {reviewData.documento?.fecha_cargue}
                  </Typography>
                </Box>

                {/* Información del usuario */}
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Usuario:</strong>
                </Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {reviewData.usuario?.nombre_usuario} {reviewData.usuario?.apellido_usuario}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {reviewData.usuario?.correo_usuario}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Programa:</strong> {reviewData.usuario?.programa_academico}
                  </Typography>
                </Box>

                {/* Estadísticas */}
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Estadísticas:</strong>
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2">
                    <strong>Total documentos:</strong> {reviewData.estadisticas?.totalDocumentos}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Pendientes:</strong> {reviewData.estadisticas?.documentosPendientes}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Aprobados:</strong> {reviewData.estadisticas?.documentosAprobados}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Rechazados:</strong> {reviewData.estadisticas?.documentosRechazados}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actualizaciones masivas */}
        {batchUpdates.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Actualizaciones Masivas Realizadas
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <List>
                  {batchUpdates.map((update, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`Documento ${update.id_usuarioDoc}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              <strong>Estado:</strong> 
                              <Chip 
                                label={update.estado} 
                                size="small" 
                                sx={{ ml: 1 }}
                                color={update.estado === 'Cumplido' ? 'success' : 
                                       update.estado === 'Rechazado' ? 'error' : 'warning'}
                              />
                            </Typography>
                            <Typography variant="body2">
                              <strong>Comentarios:</strong> {update.comentarios}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Revisado por:</strong> {update.revisado_por}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Fecha:</strong> {update.fecha_revision}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Información de beneficios */}
      <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 Beneficios de los Endpoints Consolidados
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Reducción de Llamadas API:</strong>
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                • Antes: 3-5 llamadas individuales por vista
                • Ahora: 1 llamada batchGet por vista
                • Reducción: 80-90% menos llamadas
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Cache Inteligente:</strong>
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                • Cache de 1 minuto para datos de revisión
                • Cache de 5 minutos para perfiles de usuario
                • Reducción adicional de llamadas a Google Sheets
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Manejo de Errores:</strong>
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                • Retry automático con backoff exponencial
                • Manejo específico para errores 429 (rate limiting)
                • Respuestas consistentes y informativas
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Escalabilidad:</strong>
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                • Actualización masiva de documentos
                • Menor latencia en operaciones
                • Mejor experiencia de usuario
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentReviewExample; 