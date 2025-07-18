import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore,
  VaccinesOutlined,
  Visibility,
  Edit,
  CloudUpload,
  Description
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import StatusChip from './StatusChip';

const DoseGroupAccordion = ({
  doc,
  formatDate,
  getRowBackground,
  getButtonColor,
  handleOpenModal,
  handleOpenUploadModal,
  theme
}) => {
  return (
    <Accordion 
      sx={{ 
        boxShadow: 'none',
        border: 'none',
        width: '100%',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
        m: 0
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: getRowBackground(doc.estado),
          width: '100%',
          p: 0,
          '&:hover': {
            backgroundColor: alpha(theme.palette.grey[300], 0.3),
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          }}>
            <VaccinesOutlined fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              color: theme.palette.secondary.main,
              mb: 0.25,
              fontSize: '0.85rem'
            }}>
              {doc.nombre}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={doc.progress || `0/${doc.totalDoses}`}
                size="small"
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  height: '20px'
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {doc.completedDoses || 0} aprobadas
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
            <StatusChip status={doc.estado} />
            <Typography variant="caption" color="text.secondary">
              {doc.fechaCargue ? `Última carga: ${formatDate(doc.fechaCargue)}` : 'Sin cargar'}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, width: '100%' }}>
        <Grid container spacing={2}>
          {doc.doseStatuses?.map((doseInfo, doseIndex) => (
            <Grid item xs={12} sm={6} md={4} key={`dose-${doseInfo.doseNumber}-${doseIndex}`}>
              <Card 
                sx={{ 
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: getRowBackground(doseInfo.status),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 12px rgba(178, 34, 34, 0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VaccinesOutlined color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {doc.nombre}
                    </Typography>
                  </Box>
                  <Chip label={`Dosis ${doseInfo.doseNumber}`} size="small" sx={{ ml: 1, fontWeight: 600, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                  <StatusChip status={doseInfo.status} />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {doseInfo.userDoc?.fecha_cargue ? `Cargado: ${formatDate(doseInfo.userDoc.fecha_cargue)}` : 'No cargado'}
                  </Typography>
                  {doseInfo.userDoc?.fecha_expedicion && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Expedición: {formatDate(doseInfo.userDoc.fecha_expedicion)}
                    </Typography>
                  )}
                  {doseInfo.userDoc?.fecha_vencimiento && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Vencimiento: {formatDate(doseInfo.userDoc.fecha_vencimiento)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  {doseInfo.userDoc?.comentarios && (
                    <Tooltip title={doseInfo.userDoc.comentarios}>
                      <Typography variant="caption" sx={{
                        maxWidth: 120,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'text.secondary'
                      }}>
                        {doseInfo.userDoc.comentarios}
                      </Typography>
                    </Tooltip>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                    {doseInfo.userDoc?.ruta_archivo && (
                      <Tooltip title="Ver documento">
                        <IconButton
                          size="small"
                          onClick={() => window.open(doseInfo.userDoc.ruta_archivo, '_blank', 'noopener,noreferrer')}
                          sx={{ bgcolor: 'primary.light', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' }, m: 0.1 }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {/* Botón para cargar documento si está sin cargar */}
                    {doseInfo.status === 'sin cargar' && (
                      <Tooltip title="Cargar documento">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenUploadModal({
                            id: doc.baseDoc.id_doc || doc.baseDoc.id_tipoDoc || doc.id,
                            nombre: doc.nombre,
                            vence: doc.vence,
                            tiempo_vencimiento: doc.baseDoc?.tiempo_vencimiento,
                            doseNumber: doseInfo.doseNumber
                          })}
                          sx={{ bgcolor: 'success.light', color: 'success.main', '&:hover': { bgcolor: 'success.main', color: 'white' }, m: 0.1 }}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {/* Botón actualizar dosis si no está aprobada y tiene archivo */}
                    {doseInfo.userDoc?.ruta_archivo && doseInfo.status !== 'aprobado' && (
                      <Tooltip title="Actualizar documento">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenUploadModal({
                            id: doc.baseDoc.id_doc || doc.baseDoc.id_tipoDoc || doc.id,
                            nombre: doc.nombre,
                            vence: doc.vence,
                            tiempo_vencimiento: doc.baseDoc?.tiempo_vencimiento,
                            doseNumber: doseInfo.doseNumber,
                            existingDoc: {
                              fecha_expedicion: doseInfo.userDoc.fecha_expedicion,
                              fecha_vencimiento: doseInfo.userDoc.fecha_vencimiento,
                              fecha_cargue: doseInfo.userDoc.fecha_cargue,
                              ruta_archivo: doseInfo.userDoc.ruta_archivo
                            }
                          })}
                          sx={{ bgcolor: 'warning.light', color: 'warning.main', '&:hover': { bgcolor: 'warning.main', color: 'white' }, m: 0.1 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {doseInfo.userDoc && (
                      <Tooltip title="Revisar dosis">
                        <IconButton
                          size="small"
                          color={getButtonColor(doseInfo.status)}
                          onClick={() => handleOpenModal({
                            ...doseInfo.userDoc,
                            nombre: `${doc.nombre} - Dosis ${doseInfo.doseNumber}`,
                            vence: doc.vence
                          })}
                          sx={{ bgcolor: 'info.light', color: getButtonColor(doseInfo.status) === 'success' ? 'success.main' : getButtonColor(doseInfo.status) === 'error' ? 'error.main' : 'info.main', '&:hover': { bgcolor: getButtonColor(doseInfo.status) === 'success' ? 'success.main' : getButtonColor(doseInfo.status) === 'error' ? 'error.main' : 'info.main', color: 'white' }, m: 0.1 }}
                        >
                          <Description fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default DoseGroupAccordion; 