import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Payment, PaymentInput } from "../types/payments";
import { searchPatients } from "../api/patients";
import { Patient } from "../types/patients";

interface Props {
  onSubmit: (data: PaymentInput) => void;
  payment?: Payment | null;
}

export default function PaymentForm({ onSubmit, payment }: Props) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<PaymentInput>({
    appointment: payment?.appointment || 0,
    patient_id: payment?.patient_id || 0,
    amount: payment?.amount || "",
    method: payment?.method || "cash",
    status: payment?.status || "pending",
    reference_number: payment?.reference_number || "",
    bank_name: payment?.bank_name || "",
    received_by: payment?.received_by || "",
    received_at: payment?.received_at?.split("T")[0] || "",
  });

  // 🔹 Buscar pacientes cuando el query tenga al menos 2 caracteres
  const { data: results = [] } = useQuery<Patient[]>({
    queryKey: ["searchPatients", query],
    queryFn: () => searchPatients(query),
    enabled: query.length > 1,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 🔹 Autocomplete de Pacientes */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={query || (form.patient_id ? `ID: ${form.patient_id}` : "")}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul
            style={{
              position: "absolute",
              background: "white",
              border: "1px solid #ccc",
              width: "100%",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 10,
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {results.map((p) => (
              <li
                key={p.id}
                style={{ padding: "0.5rem", cursor: "pointer" }}
                onClick={() => {
                  setForm({ ...form, patient_id: p.id });
                  setQuery(p.name); // mostrar nombre en el input
                }}
              >
                {p.name} {p.national_id && `– ${p.national_id}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Monto */}
      <input
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        placeholder="Monto"
        required
      />

      {/* Método */}
      <select name="method" value={form.method} onChange={handleChange}>
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="transfer">Transferencia</option>
      </select>

      {/* Estado */}
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="canceled">Cancelado</option>
        <option value="waived">Exonerado</option>
      </select>

      {/* Referencia */}
      <input
        type="text"
        name="reference_number"
        value={form.reference_number}
        onChange={handleChange}
        placeholder="Número de referencia"
      />

      {/* Banco */}
      <input
        type="text"
        name="bank_name"
        value={form.bank_name}
        onChange={handleChange}
        placeholder="Banco"
      />

      {/* Recibido por */}
      <input
        type="text"
        name="received_by"
        value={form.received_by}
        onChange={handleChange}
        placeholder="Recibido por"
      />

      {/* Fecha */}
      <input
        type="date"
        name="received_at"
        value={form.received_at}
        onChange={handleChange}
      />

      <button type="submit">Guardar</button>
    </form>
  );
}
