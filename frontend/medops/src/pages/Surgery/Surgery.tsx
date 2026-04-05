// src/pages/Surgery/Surgery.tsx
import PageHeader from "@/components/Common/PageHeader";
export default function Surgery() {
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Cirugía", active: true }
        ]}
      />
      
      <div className="bg-white/5 border border-white/15 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Módulo de Cirugía</h2>
          <p className="text-white/50">Próximamente: Gestión integral de procedimientos quirúrgicos</p>
        </div>
      </div>
    </div>
  );
}