// src/components/Patients/sections/AlertModal.tsx
import React, { useState, useEffect } from "react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { type: "danger" | "warning" | "info"; message: string }) => void;
  initial?: { type: "danger" | "warning" | "info"; message: string };
}
export default function AlertModal({ open, onClose, onSave, initial }: Props) {
  // 🔍 DIAGNOSTIC LOG: Verificar si este modal está abierto
  console.log('AlertModal open:', open);
  
  const [form, setForm] = useState<{ type: "danger" | "warning" | "info"; message: string }>({
    type: initial?.type ?? "warning",
    message: initial?.message ?? "",
  });
  // Sincronizar estado cuando se edita una alerta existente
  useEffect(() => {
    if (initial) {
      setForm({ type: initial.type, message: initial.message });
    }
  }, [initial]);
  // ⭐ NEW: Agregar soporte para tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  if (!open) return null;
  const handleSave = () => {
    if (form.message.trim() === "") return; // Evitar guardar vacío
    onSave(form);
  };
  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose} // ✅ FIX: Agregar onClick al backdrop
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()} // ✅ FIX: Prevenir cerrar al hacer clic en el contenido
      >
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? "Editar alerta" : "Nueva alerta"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "danger" | "warning" | "info" })}
            >
              <option value="danger">Peligro</option>
              <option value="warning">Advertencia</option>
              <option value="info">Información</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Mensaje</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Escriba el mensaje de la alerta..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-[#0d2c53] text-white text-sm rounded-md hover:bg-[#0b2444]"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}