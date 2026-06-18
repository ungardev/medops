// src/pages/Diagnosis/components/DisclaimerBanner.tsx
import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>
        <strong className="font-semibold">Aviso médico:</strong>{" "}
        Las calculadoras son herramientas de apoyo. Los resultados no sustituyen el criterio clínico
        profesional. Siempre confirme con examen físico y estudios complementarios antes de tomar
        decisiones clínicas.
      </div>
    </div>
  );
}
