// src/lib/subdomain.ts
export const SUBDOMAIN_CONFIG = {
  patient: {
    hostname: 'patient.medopz.com',
    loginPath: '/patient/login',
    dashboardPath: '/patient',
    apiVerifyEndpoint: '/patient/auth/verify/',
    role: 'patient' as const,
  },
  app: {
    hostname: 'app.medopz.com',
    loginPath: '/login',
    dashboardPath: '/doctor',
    apiVerifyEndpoint: '/auth/verify/',
    role: 'doctor' as const,
  },
};

export type PortalType = 'patient' | 'app';

export function getCurrentPortal(): PortalType {
  if (typeof window === 'undefined') return 'app';
  const hostname = window.location.hostname;
  return hostname.startsWith('patient.') ? 'patient' : 'app';
}

export function getPortalConfig(portal: PortalType = getCurrentPortal()) {
  return SUBDOMAIN_CONFIG[portal];
}

export function isPatientSubdomain(): boolean {
  return getCurrentPortal() === 'patient';
}