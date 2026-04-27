// Environment Configuration - MEDOPZ Landing
// Configura aquí las URLs de producción cuando estén disponibles

export const config = {
  // Landing Page URL
  landing: {
    dev: 'http://localhost:4321',
    prod: 'https://medopz.com', // o landing.medopz.com
  },

  // Doctor Portal
  doctor: {
    dev: 'http://localhost:8080/login',
    prod: 'https://app.medopz.com/login',
  },

  // Patient Portal
  patient: {
    dev: 'http://localhost:8080/patient/login',
    prod: 'https://patient.medopz.com/login',
  },

  // Backend API
  api: {
    dev: 'http://localhost:8080',
    prod: 'https://api.medopz.com',
  },

  // Email
  email: 'info.medopz@gmail.com',
};

// Helper para obtener URL por ambiente
export function getUrl(service: 'doctor' | 'patient' | 'api' | 'landing', env: 'dev' | 'prod' = 'dev'): string {
  // En Astro puedes usar import.meta.env.MODE para detectar el ambiente
  const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  const environment = isDev ? 'dev' : 'prod';
  return config[service][environment];
}
