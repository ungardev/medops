import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface FamilyMember {
  link_id: number;
  patient_id: number;
  full_name: string;
  national_id: string | null;
  age: number | null;
  is_minor: boolean;
  birthdate: string | null;
  relationship_type: 'self' | 'child' | 'dependent';
  relationship_type_display: string;
  created_at: string;
}

interface PatientContextType {
  activePatientId: number | null;
  activePatient: FamilyMember | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  setActivePatient: (patientId: number) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (linkId: number) => void;
  refreshFamilyMembers: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = 'active_patient_id';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePatientId, setActivePatientId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePatient = familyMembers.find(m => m.patient_id === activePatientId) || null;

  const getPatientToken = useCallback((): string | null => {
    return localStorage.getItem('patient_access_token')
      || localStorage.getItem('patient_drf_token')
      || null;
  }, []);

  const refreshFamilyMembers = useCallback(async () => {
    const token = getPatientToken();
    if (!token) {
      setError('No autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/patient-family-links/family/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'X-Portal': 'patient',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar familiares');
      }

      const data = await response.json();
      setFamilyMembers(data.family || []);

      if (data.family && data.family.length > 0 && !activePatientId) {
        const selfMember = data.family.find((m: FamilyMember) => m.relationship_type === 'self');
        if (selfMember) {
          setActivePatientId(selfMember.patient_id);
          localStorage.setItem(STORAGE_KEY, String(selfMember.patient_id));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [getPatientToken, activePatientId]);

  const setActivePatient = useCallback((patientId: number) => {
    setActivePatientId(patientId);
    localStorage.setItem(STORAGE_KEY, String(patientId));
    localStorage.setItem('patient_id', String(patientId));
  }, []);

  const addFamilyMember = useCallback((member: FamilyMember) => {
    setFamilyMembers(prev => [...prev, member]);
  }, []);

  const removeFamilyMember = useCallback((linkId: number) => {
    setFamilyMembers(prev => prev.filter(m => m.link_id !== linkId));
  }, []);

  useEffect(() => {
    refreshFamilyMembers();
  }, []);

  useEffect(() => {
    if (activePatientId) {
      localStorage.setItem('patient_id', String(activePatientId));
    }
  }, [activePatientId]);

  return (
    <PatientContext.Provider
      value={{
        activePatientId,
        activePatient,
        familyMembers,
        isLoading,
        error,
        setActivePatient,
        addFamilyMember,
        removeFamilyMember,
        refreshFamilyMembers,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
