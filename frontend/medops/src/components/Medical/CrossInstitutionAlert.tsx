// src/components/Medical/CrossInstitutionAlert.tsx
import React, { useState } from 'react';
import { ExclamationTriangleIcon, ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
interface CrossInstitutionAlertProps {
  sourceInstitution: string;
  targetInstitution: string;
  patientName: string;
  accessLevel: 'read_only' | 'limited';
  onAcknowledge?: () => void;
}
export default function CrossInstitutionAlert({
  sourceInstitution,
  targetInstitution,
  patientName,
  accessLevel,
  onAcknowledge
}: CrossInstitutionAlertProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge?.();
  };
  if (acknowledged) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>Acceso multi-institucional activo</strong>
            <p className="text-xs mt-1">Estás viendo datos de "{targetInstitution}" en modo {accessLevel === 'read_only' ? 'solo lectura' : 'limitado'}.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="w-4 h-4 text-yellow-600" />
            <h3 className="text-sm font-semibold text-yellow-800">
              Acceso Multi-Institucional Detectado
            </h3>
          </div>
          
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>Paciente:</strong> {patientName}
            </p>
            <p>
              <strong>Institución Origen:</strong> {sourceInstitution}
            </p>
            <p>
              <strong>Institución Accedida:</strong> {targetInstitution}
            </p>
            <p>
              <strong>Nivel de Acceso:</strong> 
              <span className={
                accessLevel === 'read_only' 
                  ? 'text-yellow-800 font-medium' 
                  : 'text-orange-800 font-medium'
              }>
                {accessLevel === 'read_only' ? 'Solo Lectura' : 'Limitado'}
              </span>
            </p>
          </div>
          
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <p className="text-xs text-yellow-600 italic">
              Esta acción está siendo auditada. El acceso a datos de otras instituciones está estrictamente regulado.
            </p>
          </div>
          
          <button
            onClick={handleAcknowledge}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition-colors"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            Entendido y Acepto
          </button>
        </div>
      </div>
    </div>
  );
}