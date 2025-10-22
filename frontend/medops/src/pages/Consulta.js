import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAppointmentDetail, updateAppointmentStatus } from "../api/appointments";
export default function Consulta() {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    useEffect(() => {
        if (!id)
            return;
        fetchAppointmentDetail(Number(id))
            .then((data) => setAppointment(data)) // ✅ data tipado
            .finally(() => setLoading(false));
    }, [id]);
    const handleComplete = async () => {
        if (!appointment)
            return;
        const updated = await updateAppointmentStatus(appointment.id, "completed"); // ✅ updated tipado
        setAppointment(updated);
    };
    if (loading)
        return _jsx("p", { children: "Cargando consulta..." });
    if (!appointment)
        return _jsx("p", { children: "No se encontr\u00F3 la cita" });
    return (_jsxs("div", { children: [_jsx("h2", { children: "Consulta del paciente" }), _jsxs("div", { style: { marginBottom: "20px", padding: "10px", background: "#f1f5f9" }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Paciente:" }), " ", appointment.patient.name] }), " ", _jsxs("p", { children: [_jsx("strong", { children: "Fecha:" }), " ", appointment.appointment_date] }), _jsxs("p", { children: [_jsx("strong", { children: "Tipo:" }), " ", appointment.appointment_type] }), _jsxs("p", { children: [_jsx("strong", { children: "Estado:" }), " ", appointment.status] }), _jsxs("p", { children: [_jsx("strong", { children: "Monto esperado:" }), " $", appointment.expected_amount] })] }), _jsx("h3", { children: "Evoluci\u00F3n" }), _jsx("textarea", { value: notes, onChange: e => setNotes(e.target.value), rows: 6, style: { width: "100%", marginBottom: "20px" }, placeholder: "Escriba aqu\u00ED la evoluci\u00F3n cl\u00EDnica..." }), _jsx("button", { onClick: handleComplete, disabled: appointment.status === "completed", style: { background: "#10b981", color: "#fff", padding: "8px 16px" }, children: "Finalizar consulta" })] }));
}
