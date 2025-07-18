import { createTheme, alpha } from '@mui/material/styles';

export const studentDocumentManagerTheme = createTheme({
  palette: {
    primary: {
      main: '#B22222', // Color rojo sangre toro (Universidad del Valle)
      light: alpha('#B22222', 0.15), // Versión muy suave del color primario
    },
    secondary: {
      main: '#1976d2',
      light: alpha('#1976d2', 0.15),
    },
    success: {
      main: '#4caf50',
      light: alpha('#4caf50', 0.15), // Color verde muy suave
    },
    warning: {
      main: '#ff9800',
      light: alpha('#ff9800', 0.15), // Color naranja muy suave
    },
    error: {
      main: '#f44336',
      light: alpha('#f44336', 0.15), // Color rojo muy suave
    },
    info: {
      main: '#2196f3',
      light: alpha('#2196f3', 0.15), // Color azul muy suave
    },
    default: {
      light: '#f5f5f5',
      main: '#9e9e9e',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        outlined: {
          borderWidth: 1.5,
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    }
  }
}); 