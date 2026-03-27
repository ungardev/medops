// src/lib/auth.ts
export const STORAGE_KEYS = {
  PATIENT_TOKEN: 'patient_access_token',
  DOCTOR_TOKEN: 'authToken',
  USER: 'auth_user',
};
export const getAuthToken = (type: 'patient' | 'doctor' = 'patient'): string | null => {
  const key = type === 'patient' ? STORAGE_KEYS.PATIENT_TOKEN : STORAGE_KEYS.DOCTOR_TOKEN;
  return localStorage.getItem(key);
};
export const setAuthToken = (type: 'patient' | 'doctor', token: string): void => {
  const key = type === 'patient' ? STORAGE_KEYS.PATIENT_TOKEN : STORAGE_KEYS.DOCTOR_TOKEN;
  localStorage.setItem(key, token);
};
export const clearAuthToken = (type: 'patient' | 'doctor'): void => {
  const key = type === 'patient' ? STORAGE_KEYS.PATIENT_TOKEN : STORAGE_KEYS.DOCTOR_TOKEN;
  localStorage.removeItem(key);
};
export const clearAllAuth = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};
export const getUserData = (): any => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};
export const setUserData = (user: any): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};