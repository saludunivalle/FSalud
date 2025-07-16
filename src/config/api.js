const API_BASE_URL = process.env.NODE_ENV === 'production'
? 'https://fsalud-server-saludunivalles-projects.vercel.app' // URL del BACKEND para producción
: 'http://localhost:3001'; // URL del BACKEND para desarrollo

export default API_BASE_URL;