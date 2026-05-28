// src/pages/Admin/BancaribeConfig.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import toast from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon, BanknotesIcon } from "@heroicons/react/24/outline";

export default function BancaribeConfig() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
    webhook_secret: "",
    settlement_account: "",
    settlement_bank_code: "0114",
    is_test_mode: true,
    is_active: false,
    auto_verify_payments: true,
    auto_disbursement_enabled: false,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-bancaribe-config"],
    queryFn: () => apiFetch("admin/bancaribe/config/"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch("admin/bancaribe/config/", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["admin-bancaribe-config"] });
    },
    onError: () => toast.error("Error guardando configuración"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Configuración Bancaribe</h1>
          <p className="text-sm text-white/40">API de pagos y transferencias</p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            form.is_active
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {form.is_active ? (
            <CheckCircleIcon className="w-4 h-4" />
          ) : (
            <XCircleIcon className="w-4 h-4" />
          )}
          <span className="text-[11px] font-medium">
            {form.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client ID */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="bancaribe_client_id"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Client Secret
            </label>
            <input
              type="password"
              value={form.client_secret}
              onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="••••••••"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Webhook Secret
            </label>
            <input
              type="password"
              value={form.webhook_secret}
              onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="••••••••"
            />
          </div>

          {/* Settlement Account */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Cuenta de Liquidación
            </label>
            <input
              type="text"
              value={form.settlement_account}
              onChange={(e) => setForm({ ...form, settlement_account: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="1234567890"
            />
          </div>

          {/* Settlement Bank Code */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Código Banco Liquidación
            </label>
            <select
              value={form.settlement_bank_code}
              onChange={(e) => setForm({ ...form, settlement_bank_code: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="0114">0114 - BANCARIBE</option>
              <option value="0102">0102 - BANCO DE VENEZUELA</option>
              <option value="0105">0105 - BANCO MERCANTIL</option>
              <option value="0134">0134 - BANESCO</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_test_mode}
              onChange={(e) => setForm({ ...form, is_test_mode: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[12px] text-white/70">Modo Sandbox</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[12px] text-white/70">Activar</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_verify_payments}
              onChange={(e) => setForm({ ...form, auto_verify_payments: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[12px] text-white/70">Verificación Automática</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_disbursement_enabled}
              onChange={(e) => setForm({ ...form, auto_disbursement_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[12px] text-white/70">Desembolso Automático</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {saveMutation.isPending ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </div>
  );
}
