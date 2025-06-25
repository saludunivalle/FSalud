import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Select,
  InputLabel,
  FormControl,
  Autocomplete
} from '@mui/material';
import { getAllPrograms } from '../../services/programsService';
import { createUserFromAdmin } from '../../services/userService';

const documentTypes = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' }
];

const roleOptions = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'docente', label: 'Docente' }
];

const UserCreateModal = ({ open, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    phone: '',
    email: '',
    role: 'estudiante',
    birthDate: '',
    program: '',
    sede: ''
  });
  const [errors, setErrors] = useState({});
  const [programs, setPrograms] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        firstName: '',
        lastName: '',
        documentType: '',
        documentNumber: '',
        phone: '',
        email: '',
        role: 'estudiante',
        birthDate: '',
        program: '',
        sede: ''
      });
      setErrors({});
      setSuccess(false);
      setErrorMsg('');
      setLoading(false);
      getAllPrograms().then(programsData => {
        setPrograms(programsData);
        const uniqueSedes = [...new Set(programsData.map(p => p.sede))].filter(Boolean).sort();
        setSedes(uniqueSedes.map(sede => ({ value: sede, label: sede })));
      });
    }
  }, [open]);

  const filteredPrograms = formData.sede
    ? programs.filter(p => p.sede === formData.sede)
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.documentType) newErrors.documentType = 'Tipo de documento requerido';
    if (!formData.documentNumber.trim()) newErrors.documentNumber = 'Número de documento requerido';
    if (!formData.phone.trim()) newErrors.phone = 'Teléfono requerido';
    if (!formData.email.trim()) newErrors.email = 'Correo electrónico requerido';
    if (!formData.birthDate) newErrors.birthDate = 'Fecha de nacimiento requerida';
    if (!formData.sede) newErrors.sede = 'Sede requerida';
    if (!formData.program) newErrors.program = 'Programa requerido';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setErrorMsg('');
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      await createUserFromAdmin(formData);
      setLoading(false);
      setSuccess(true);
      if (onUserCreated) onUserCreated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Error al crear usuario');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear usuario nuevo</DialogTitle>
      <DialogContent>
        {success && <Alert severity="success">Usuario creado exitosamente.</Alert>}
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.documentType}>
                <InputLabel>Tipo de documento</InputLabel>
                <Select
                  label="Tipo de documento"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                >
                  {documentTypes.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {errors.documentType && <span style={{ color: 'red', fontSize: 12 }}>{errors.documentType}</span>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Número de documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                error={!!errors.documentNumber}
                helperText={errors.documentNumber}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo electrónico"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de nacimiento"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                error={!!errors.birthDate}
                helperText={errors.birthDate}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>Rol</InputLabel>
                <Select
                  label="Rol"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {roleOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.sede}>
                <InputLabel>Sede</InputLabel>
                <Select
                  label="Sede"
                  name="sede"
                  value={formData.sede}
                  onChange={handleChange}
                >
                  {sedes.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {errors.sede && <span style={{ color: 'red', fontSize: 12 }}>{errors.sede}</span>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.program}>
                <InputLabel>Programa</InputLabel>
                <Select
                  label="Programa"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  disabled={!formData.sede}
                >
                  {filteredPrograms.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {errors.program && <span style={{ color: 'red', fontSize: 12 }}>{errors.program}</span>}
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Crear usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserCreateModal; 