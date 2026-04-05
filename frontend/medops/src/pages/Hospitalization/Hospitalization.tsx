// src/pages/Hospitalization/Hospitalization.tsx
import PageHeader from "@/components/Common/PageHeader";
export default function Hospitalization() {
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Hospitalización", active: true }
        ]}
      />
      
      <div className="bg-white/5 border border-white/15 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Módulo de Hospitalización</h2>
          <p className="text-white/50">Próximamente: Gestión de ingresos y seguimiento hospitalario</p>
        </div>
      </div>
    </div>
  );
}