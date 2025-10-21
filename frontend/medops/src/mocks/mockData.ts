// Utilidad para generar fechas pasadas
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// 🔹 Mock de pacientes
export const mockPatients = [
  { id: 1, name: "Ana Pérez", age: 30 },
  { id: 2, name: "Luis Gómez", age: 45 },
  { id: 3, name: "María Rodríguez", age: 28 },
  { id: 4, name: "Carlos Fernández", age: 50 },
];

// 🔹 Mock de citas (con patientId)
export const mockAppointments = [
  { id: 1, patientId: 1, status: "completed", date: daysAgo(90) },
  { id: 2, patientId: 2, status: "completed", date: daysAgo(75) },
  { id: 3, patientId: 3, status: "pending",   date: daysAgo(60) },
  { id: 4, patientId: 1, status: "completed", date: daysAgo(45) },
  { id: 5, patientId: 4, status: "pending",   date: daysAgo(30) },
  { id: 6, patientId: 2, status: "completed", date: daysAgo(15) },
  { id: 7, patientId: 3, status: "completed", date: daysAgo(7)  },
];

// 🔹 Mock de pagos (con patientId)
export const mockPayments = [
  { id: 1, patientId: 1, amount: 50,  date: daysAgo(85) },
  { id: 2, patientId: 2, amount: 75,  date: daysAgo(70) },
  { id: 3, patientId: 3, amount: 100, date: daysAgo(55) },
  { id: 4, patientId: 1, amount: 60,  date: daysAgo(40) },
  { id: 5, patientId: 4, amount: 80,  date: daysAgo(25) },
  { id: 6, patientId: 2, amount: 120, date: daysAgo(10) },
  { id: 7, patientId: 3, amount: 90,  date: daysAgo(3)  },
];

// 🔹 Mock de eventos
export const mockEvents = [
  { id: 1, title: "Jornada Médica", description: "Atención gratuita", date: daysAgo(60) },
  { id: 2, title: "Vacunación", description: "Campaña de salud", date: daysAgo(30) },
  { id: 3, title: "Charla preventiva", description: "Educación en salud", date: daysAgo(10) },
];

// 🔹 Mock de consultas exoneradas (ya tenían patientId)
export const mockWaivedConsultations = [
  { id: 1, patientId: 1, reason: "Bajo recursos", date: daysAgo(45) },
  { id: 2, patientId: 2, reason: "Programa social", date: daysAgo(20) },
  { id: 3, patientId: 3, reason: "Emergencia", date: daysAgo(5) },
];
